import { http } from "msw";
import { getDb, findById, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  badRequest,
  notFound,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";
import type { FileAttachment, CAP } from "@/types";

/** Max upload size enforced by the mock API (matches UI: 10 MB). */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function handleGetFileList({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.files];

  if (q.capId) {
    items = items.filter((f) => f.capId === q.capId);
  }
  if (q.ids) {
    const ids = q.ids.split(",").map((s) => s.trim());
    items = items.filter((f) => ids.includes(f.id));
  }
  if (q.search) {
    items = filterByText(items, q.search, ["name", "uploadedBy"]);
  }
  // Newest first.
  items.sort(
    (a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 50);
  return jsonResponse(paginate(items, page, pageSize));
}

/**
 * Mock multipart upload. Reads the File + optional `capId` from FormData,
 * mints a blob object URL so downloads work in dev, persists metadata, and
 * links the file to the CAP when `capId` resolves to an existing CAP.
 */
export async function handleUploadFile({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected multipart/form-data upload");
  }
  const file = form.get("file");
  const capId = (form.get("capId") as string | null) ?? undefined;

  if (!(file instanceof File)) {
    return badRequest("No file attached (field must be named 'file')");
  }
  if (file.size > MAX_FILE_SIZE) {
    return badRequest(`File exceeds the 10 MB limit`);
  }
  if (!file.name) {
    return badRequest("File must have a name");
  }

  const db = getDb();
  const now = new Date().toISOString();
  // Object URLs survive for the page lifetime — good enough for mock mode.
  const url = URL.createObjectURL(file);

  // Uploader identity is passed through from the client (auth store), with
  // safe fallbacks so uploads never fail on missing identity in mock mode.
  const uploadedBy = (form.get("uploadedBy") as string | null) ?? "Unknown";
  const uploadedById =
    (form.get("uploadedById") as string | null) ?? "demo-admin";

  const attachment: FileAttachment = {
    id: `file-${crypto.randomUUID()}`,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    url,
    uploadedAt: now,
    uploadedBy,
    uploadedById,
    capId,
    createdAt: now,
    updatedAt: now,
  };

  // Link to the CAP when one is referenced and exists.
  if (capId) {
    const cap = findById(db.caps, capId);
    if (cap && !cap.fileIds.includes(attachment.id)) {
      cap.fileIds = [...cap.fileIds, attachment.id];
    }
  }

  db.files.unshift(attachment);
  return jsonResponse(attachment, 201);
}

export async function handleDeleteFile({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.files.findIndex((f) => f.id === params.id);
  if (index === -1) return notFound("File not found");

  const [removed] = db.files.splice(index, 1);

  // Revoke any object URL we minted to avoid leaking blob memory.
  if (removed.url.startsWith("blob:")) {
    URL.revokeObjectURL(removed.url);
  }

  // Unlink from any CAP that referenced it.
  for (const cap of db.caps as CAP[]) {
    if (cap.fileIds.includes(removed.id)) {
      cap.fileIds = cap.fileIds.filter((id) => id !== removed.id);
    }
  }

  return jsonResponse({ success: true });
}

export const fileHandlers = [
  http.get("/api/files", handleGetFileList),
  http.post("/api/files", handleUploadFile),
  http.delete("/api/files/:id", handleDeleteFile),
];
