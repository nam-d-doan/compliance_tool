import type { BaseEntity } from "./base";

/**
 * A file attached to a CAP (Corrective Action Plan). Stored as metadata only;
 * the binary lives behind `url` (an object URL in dev mock mode, a real CDN
 * URL in production).
 */
export interface FileAttachment extends BaseEntity {
  /** Original filename including extension. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** MIME type (e.g. `application/pdf`, `image/png`). */
  type: string;
  /** Downloadable URL (mock object URL in dev, real URL in prod). */
  url: string;
  /** ISO timestamp of the upload. */
  uploadedAt: string;
  /** Display name of the uploader. */
  uploadedBy: string;
  /** User ID of the uploader. */
  uploadedById: string;
  /** Linked CAP ID, when the file belongs to a specific CAP. */
  capId?: string;
}

export interface FileFilter {
  capId?: string;
  /** Fetch a specific set of files by ID (joined comma-separated on the wire). */
  ids?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}
