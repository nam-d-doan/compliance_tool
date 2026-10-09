/**
 * Sinh 1 file PDF 1 trang tối giản (chỉ ASCII) cho file mẫu của demo — file
 * seed không có nội dung thật, link mock-files.example.com bấm mở sẽ lỗi.
 */
export function makeDemoPdf(lines: string[]): Blob {
  const esc = (s: string) => s.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7e]/g, "?");
  const text = lines
    .map((l, i) => `BT /F1 ${i === 0 ? 16 : 11} Tf 56 ${780 - i * 24} Td (${esc(l)}) Tj ET`)
    .join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function isMockFileUrl(url: string): boolean {
  return url.startsWith("https://mock-files.example.com/");
}
