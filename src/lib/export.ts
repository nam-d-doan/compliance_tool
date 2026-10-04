/**
 * Client-side exports for the demo: real files, no backend.
 * - CSV is written with a UTF-8 BOM so Excel shows Vietnamese correctly.
 * - PDF uses the browser's print dialog ("Save as PDF") limited to the
 *   element marked `.print-area` (see the print rules in index.css).
 */

type Cell = string | number | null | undefined;

function escapeCsv(value: Cell): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, rows: Cell[][]): void {
  const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the print dialog for the `.print-area` element on the page. */
export function printReport(title: string): void {
  const previous = document.title;
  document.title = title;
  document.body.classList.add("printing-report");
  window.print();
  document.body.classList.remove("printing-report");
  document.title = previous;
}
