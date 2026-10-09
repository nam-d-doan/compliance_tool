import { http } from "msw";
import { getDb, findById, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  badRequest,
  notFound,
  parseQuery,
  parseNumber,
  actorFromRequest,
  type MockResolverContext,
} from "./utils";
import { recordEvent } from "./lm_handlers";
import type {
  FileAttachment,
  CAP,
  NonComplianceCase,
  LitigationCase,
} from "@/types";

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
  if (q.nccId) {
    items = items.filter((f) => f.nccId === q.nccId);
  }
  if (q.caseId) {
    items = items.filter((f) => f.caseId === q.caseId);
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
export async function handleUploadFile({ request }: { request: Request }) {
  await getDelay();
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Expected multipart/form-data upload");
  }
  const file = form.get("file");
  const capId = (form.get("capId") as string | null) ?? undefined;
  const nccId = (form.get("nccId") as string | null) ?? undefined;
  const caseId = (form.get("caseId") as string | null) ?? undefined;
  const folderPath = (form.get("folderPath") as string | null) || undefined;

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
  const actor = actorFromRequest(request, db.users);
  const uploadedBy =
    actor?.name ?? (form.get("uploadedBy") as string | null) ?? "Unknown";
  const uploadedById =
    actor?.id ?? (form.get("uploadedById") as string | null) ?? "demo-admin";

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
    nccId,
    caseId,
    folderPath,
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

  // Link to the NCC when one is referenced and exists.
  if (nccId) {
    const ncc = findById(db.nccs, nccId);
    if (ncc && !ncc.fileIds.includes(attachment.id)) {
      ncc.fileIds = [...ncc.fileIds, attachment.id];
    }
  }

  // Link to the LM case when one is referenced and exists.
  if (caseId) {
    const lmCase = findById(db.litigationCases, caseId);
    if (lmCase && !lmCase.fileIds.includes(attachment.id)) {
      lmCase.fileIds = [...lmCase.fileIds, attachment.id];
      recordEvent(db, caseId, "file_attached", uploadedById, uploadedBy,
        `Uploaded "${attachment.name}"`, undefined, folderPath, attachment.name);
    }
  }

  db.files.unshift(attachment);
  return jsonResponse(attachment, 201);
}

/** Hiện chỉ cho đổi folder (chuyển file giữa các folder của hồ sơ LM). */
export async function handleUpdateFile({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const file = findById(db.files, params.id as string);
  if (!file) return notFound("File not found");
  const body = (await request.json()) as { folderPath?: string | null };
  const prevFolder = file.folderPath;
  file.folderPath = body.folderPath?.trim() || undefined;
  file.updatedAt = new Date().toISOString();
  const actor = actorFromRequest(request, db.users);
  if (file.caseId && actor && prevFolder !== file.folderPath) {
    recordEvent(db, file.caseId, "file_moved", actor.id, actor.name,
      `Moved "${file.name}"`, prevFolder, file.folderPath, file.name);
  }
  return jsonResponse(file);
}

export async function handleDeleteFile({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.files.findIndex((f) => f.id === params.id);
  if (index === -1) return notFound("File not found");

  const [removed] = db.files.splice(index, 1);
  const actor = actorFromRequest(request, db.users);
  if (removed.caseId && actor) {
    recordEvent(db, removed.caseId, "file_deleted", actor.id, actor.name,
      `Deleted "${removed.name}"`, removed.folderPath, undefined, removed.name);
  }

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

  // Unlink from any NCC that referenced it.
  for (const ncc of db.nccs as NonComplianceCase[]) {
    if (ncc.fileIds.includes(removed.id)) {
      ncc.fileIds = ncc.fileIds.filter((id) => id !== removed.id);
    }
  }

  // Unlink from any LM case that referenced it.
  for (const lmCase of db.litigationCases as LitigationCase[]) {
    if (lmCase.fileIds.includes(removed.id)) {
      lmCase.fileIds = lmCase.fileIds.filter((id) => id !== removed.id);
    }
  }

  // Review fix (sau Nam review R2/R4) — CaseMilestone.linkedFileIds là nơi
  // tham chiếu file mới thêm ở R2, nhưng chỗ dọn dẹp này chưa cập nhật theo
  // nên trước đây ID mồ côi bị bỏ sót (không crash vì FE đã filter, nhưng
  // là lỗ hổng vệ sinh dữ liệu — không nhất quán với 3 vòng lặp trên).
  for (const milestone of db.caseMilestones) {
    if (milestone.linkedFileIds?.includes(removed.id)) {
      milestone.linkedFileIds = milestone.linkedFileIds.filter(
        (id) => id !== removed.id,
      );
    }
  }

  return jsonResponse({ success: true });
}

export const fileHandlers = [
  http.get("/api/files", handleGetFileList),
  http.post("/api/files", handleUploadFile),
  http.put("/api/files/:id", handleUpdateFile),
  http.delete("/api/files/:id", handleDeleteFile),
];
