import { apiGet, apiUpload, apiDelete } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type { FileAttachment, FileFilter, Paginated } from "@/types";

function buildQuery(filters: FileFilter): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  });
  return params.toString() ? `?${params.toString()}` : "";
}

export const FileService = {
  list(filters: FileFilter = {}) {
    return apiGet<Paginated<FileAttachment>>(
      `${API_ENDPOINTS.FILE_LIST}${buildQuery(filters)}`,
    );
  },

  /**
   * Upload a single file. The caller may pass `capId`/`nccId` to link the
   * attachment to a CAP/NCC and `uploadedBy`/`uploadedById` for attribution.
   */
  upload(
    file: File,
    meta: {
      capId?: string;
      nccId?: string;
      caseId?: string;
      uploadedBy?: string;
      uploadedById?: string;
      folderPath?: string;
    } = {},
  ) {
    const form = new FormData();
    form.append("file", file);
    if (meta.capId) form.append("capId", meta.capId);
    if (meta.nccId) form.append("nccId", meta.nccId);
    if (meta.caseId) form.append("caseId", meta.caseId);
    if (meta.uploadedBy) form.append("uploadedBy", meta.uploadedBy);
    if (meta.uploadedById) form.append("uploadedById", meta.uploadedById);
    if (meta.folderPath) form.append("folderPath", meta.folderPath);
    return apiUpload<FileAttachment>(API_ENDPOINTS.FILE_UPLOAD, form);
  },

  remove(id: string) {
    return apiDelete<{ success: boolean }>(API_ENDPOINTS.FILE_DELETE(id));
  },
};
