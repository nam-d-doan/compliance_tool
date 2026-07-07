export interface Article {
  id: string;
  number: string; // "1", "2A", etc.
  title: string;
  summary: string;
  effectiveDate?: string; // ISO
  status?: "active" | "amended" | "repealed";
}
