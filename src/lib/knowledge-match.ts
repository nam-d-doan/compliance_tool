/**
 * Gợi ý mục kho tri thức liên quan tới 1 yêu cầu tư vấn (review GĐ4 "Tư
 * vấn mẫu"). Demo: so khớp từ khoá, không phải tìm kiếm ngữ nghĩa thật.
 * Điểm = số thẻ của mục xuất hiện trong tiêu đề yêu cầu (×3) + số từ khoá
 * chung giữa tiêu đề yêu cầu và tiêu đề/danh mục/thẻ của mục. Chỉ giữ mục
 * có điểm ≥ nửa điểm mục khớp nhất.
 */
import type { KnowledgeBaseEntry } from "@/types";

const STOPWORDS = new Set([
  "and", "the", "for", "with", "from", "into", "under", "after", "before", "this", "that",
  "advise", "review", "clarify", "issues", "issue", "opinion", "standard", "internal",
  "precedent", "applicable", "new", "on", "of", "to", "a", "an", "in",
  // Từ quá chung trong lĩnh vực pháp chế ngân hàng — trùng chúng không có
  // nghĩa là cùng chủ đề (vd "contract", "clauses" xuất hiện ở mọi nơi).
  "contract", "clause", "term", "template", "procedure", "regulation", "condition",
  "handling", "right", "obligation", "customer", "bank", "corporate", "client",
  "product", "policy", "amended", "partner", "dispute", "resolution", "requirement",
]);

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9à-ỹ]+/i)
      // "regulations" ~ "regulation", "clauses" ~ "clause" — bỏ đuôi trước rồi mới lọc từ dừng.
      .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w))
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

export function rankKnowledgeEntries(
  requestText: string,
  entries: KnowledgeBaseEntry[],
  limit = 3,
): KnowledgeBaseEntry[] {
  const text = requestText.toLowerCase();
  const reqWords = words(requestText);
  return entries
    .map((e) => {
      // Thẻ 1 từ chung chung (vd "contract") không tính là khớp chủ đề.
      const tagHits = e.tags.filter((t) => !STOPWORDS.has(t.toLowerCase()) && text.includes(t.toLowerCase())).length;
      const entryWords = words(`${e.title} ${e.category} ${e.tags.join(" ")}`);
      let overlap = 0;
      entryWords.forEach((w) => {
        if (reqWords.has(w)) overlap += 1;
      });
      return { e, score: tagHits * 3 + overlap };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    // Chỉ giữ mục đủ gần mục khớp nhất — tránh gợi ý "cho có" chỉ trùng 1 từ phụ.
    .filter((x, _, all) => x.score * 2 >= all[0].score)
    .slice(0, limit)
    .map((x) => x.e);
}
