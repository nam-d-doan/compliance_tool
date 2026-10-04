import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { LoadingState } from "@/components/common/LoadingState";
import { PagePurpose, RfqChip, ToneBadge } from "@/components/cms";
import {
  useCmsReports,
  useLegalUpdates,
  useNCCList,
  useRevisions,
} from "@/hooks/queries";
import { useClientAudit, useSubmitReport } from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import {
  ISSUE_SOURCE_SHORT,
  LEGAL_STATUS_LABELS,
  REVISION_STATUS_LABELS,
  RISK_LEVEL_VI,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import { downloadCsv, printReport } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { ReportTemplate, ScheduledReport } from "@/types";

const FREQ_LABEL: Record<ReportTemplate["frequency"], string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  ad_hoc: "Ad hoc",
};
const RECIPIENT_LABEL: Record<ReportTemplate["recipient"], string> = {
  BĐH: "Ban Điều hành",
  HĐQT: "Hội đồng Quản trị",
  BKS: "Ban Kiểm soát",
  NHNN: "Ngân hàng Nhà nước",
};

export default function PeriodicReportsPage() {
  const { user } = useAuthStore();
  const reportsQuery = useCmsReports();
  const legal = useLegalUpdates();
  const revisions = useRevisions();
  const issues = useNCCList({}, 1, 500);
  const submit = useSubmitReport();
  const audit = useClientAudit();

  const templates = useMemo(
    () => reportsQuery.data?.templates ?? [],
    [reportsQuery.data],
  );
  const schedule = reportsQuery.data?.schedule ?? [];
  const [templateId, setTemplateId] = useState<string>("rpt-quarterly-hdqt");
  const [period, setPeriod] = useState("");
  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const now = demoNow();

  const periods = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const q = Math.ceil(m / 3);
    if (!template) return [];
    switch (template.frequency) {
      case "monthly":
        return [
          `Tháng ${m === 1 ? 12 : m - 1}/${m === 1 ? y - 1 : y}`,
          `Tháng ${m}/${y}`,
        ];
      case "quarterly":
        return [
          `Quý ${q === 1 ? 4 : q - 1}/${q === 1 ? y - 1 : y}`,
          `Quý ${q}/${y}`,
        ];
      case "yearly":
        return [`Năm ${y}`, `Năm ${y - 1}`];
      default:
        return [`Đột xuất ${format(now, "dd/MM/yyyy")}`];
    }
  }, [template, now]);

  useEffect(() => {
    if (periods.length) setPeriod(periods[0]);
  }, [periods]);

  // Live figures for the report body.
  const data = useMemo(() => {
    const lu = legal.data ?? [];
    const rv = (revisions.data ?? []).map((r) => ({
      ...r,
      health: getRevisionHealth(r, now),
    }));
    const is = issues.data?.items ?? [];
    const open = is.filter((i) => i.status === "Open");
    return {
      lu,
      rv,
      is,
      open,
      overdueRev: rv.filter((r) => r.health === "overdue"),
      lateRisk: rv.filter((r) => r.health === "late_risk"),
      issued: rv.filter((r) => r.status === "issued"),
      high: open.filter((i) => i.risk.finalLevel === "high"),
      overdueIssues: open.filter((i) => daysUntil(i.dueDate, now) < 0),
      escalations: [...is, ...rv]
        .flatMap((x) => x.escalations)
        .filter((e) => e.level >= 2),
      bySource: Object.entries(
        is.reduce<Record<string, number>>(
          (m, i) => ({
            ...m,
            [ISSUE_SOURCE_SHORT[i.source]]:
              (m[ISSUE_SOURCE_SHORT[i.source]] ?? 0) + 1,
          }),
          {},
        ),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legal.data, revisions.data, issues.data, now.toDateString()]);

  const aiNarrative = useMemo(
    () =>
      `Trong kỳ ${period}, Khối Tuân thủ đã tiếp nhận ${data.lu.length} văn bản pháp luật mới, trong đó ${data.lu.filter((l) => l.relevance === "high").length} văn bản có mức độ ảnh hưởng cao. ` +
      `Có ${data.rv.length - data.issued.length} quy định nội bộ đang được điều chỉnh; ${data.overdueRev.length} trường hợp quá hạn và ${data.lateRisk.length} trường hợp có nguy cơ chậm ban hành so với ngày hiệu lực của pháp luật. ` +
      `Hiện có ${data.open.length} vấn đề tuân thủ đang mở (${data.high.length} mức Cao), ${data.overdueIssues.length} vấn đề quá hạn khắc phục. ` +
      `Kiến nghị: ưu tiên hoàn thành ban hành các QĐNB theo Thông tư 83/2025/TT-NHNN và tăng cường giám sát nhóm vi phạm KYC/PCRT có tần suất lặp lại.`,
    [data, period],
  );
  const [narrative, setNarrative] = useState("");
  useEffect(() => setNarrative(aiNarrative), [aiNarrative]);

  if (reportsQuery.isPending || !template)
    return <LoadingState message="Loading report templates…" />;

  const reportNo = `${String(templates.indexOf(template) + 41).padStart(3, "0")}/${now.getFullYear()}/BC-NHNA-KTT`;

  const exportExcel = () => {
    downloadCsv(`${template.code}_${period.replace(/[ /]/g, "_")}`, [
      [template.name],
      [
        `Kỳ báo cáo: ${period}`,
        `Nơi nhận: ${RECIPIENT_LABEL[template.recipient]}`,
      ],
      [],
      ["1. Văn bản pháp luật mới"],
      [
        "Số hiệu",
        "Tên văn bản",
        "Cơ quan",
        "Hiệu lực",
        "Mức độ ảnh hưởng",
        "Trạng thái",
      ],
      ...data.lu.map((l) => [
        l.docNumber,
        l.title,
        l.issuer,
        format(parseISO(l.effectiveDate), "dd/MM/yyyy"),
        RISK_LEVEL_VI[l.relevance],
        LEGAL_STATUS_LABELS[l.status],
      ]),
      [],
      ["2. Tiến độ cập nhật QĐNB"],
      ["QĐNB", "Tên", "Đơn vị chủ trì", "Trạng thái", "Hạn", "Cảnh báo"],
      ...data.rv.map((r) => [
        r.qdnbCode,
        r.qdnbTitle,
        r.leadUnitName,
        REVISION_STATUS_LABELS[r.status],
        format(parseISO(r.committedDate), "dd/MM/yyyy"),
        r.health,
      ]),
      [],
      ["3. Vấn đề tuân thủ đang mở"],
      ["Mã", "Nội dung", "Nguồn", "Đơn vị", "Mức rủi ro", "Hạn"],
      ...data.open.map((i) => [
        i.nccId,
        i.title,
        ISSUE_SOURCE_SHORT[i.source],
        i.ownerUnitName,
        RISK_LEVEL_VI[i.risk.finalLevel],
        format(parseISO(i.dueDate), "dd/MM/yyyy"),
      ]),
    ]);
    audit.mutate({
      action: "export",
      module: "report",
      object: `${template.code} ${period}`,
      details: "Exported to Excel (CSV)",
    });
  };

  const exportPdf = () => {
    printReport(`${template.code}_${period}`);
    audit.mutate({
      action: "export",
      module: "report",
      object: `${template.code} ${period}`,
      details: "Exported to PDF",
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Periodic Reports"
        subtitle="Báo cáo định kỳ / đột xuất theo biểu mẫu chuẩn gửi Ban Điều hành, HĐQT, Ban Kiểm soát và NHNN — generated from live CMS data."
      >
        <RfqChip code="5.3-i" />
      </PageHero>
      <PagePurpose>
        Pick a template and period, review the AI-drafted summary, then download
        as PDF or Excel. Every export is recorded in the audit log.
      </PagePurpose>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Nam A Bank standard report forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    t.id === template.id
                      ? "border-primary bg-chart-accent/15"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold">
                      {t.code}
                    </span>
                    <ToneBadge
                      tone={
                        t.recipient === "NHNN"
                          ? "danger"
                          : t.recipient === "HĐQT"
                            ? "warning"
                            : "info"
                      }
                    >
                      {t.recipient}
                    </ToneBadge>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {FREQ_LABEL[t.frequency]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug">
                    {t.name}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4" /> Reporting calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {schedule.map((s) => (
                <ScheduleRow
                  key={s.id}
                  s={s}
                  t={templates.find((t) => t.id === s.templateId)}
                  onSubmit={() =>
                    submit.mutate(s.id, {
                      onSuccess: () =>
                        toast.success("Report marked as submitted"),
                    })
                  }
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 pt-0">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
              >
                {periods.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                to {RECIPIENT_LABEL[template.recipient]} · basis:{" "}
                {template.legalBasis}
              </span>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={exportExcel}>
                  <FileSpreadsheet className="size-4" /> Excel
                </Button>
                <Button onClick={exportPdf}>
                  <Printer className="size-4" /> PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-4 text-violet-500" /> AI-drafted
                executive summary (editable)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="min-h-28 text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNarrative(aiNarrative)}
              >
                <RefreshCw className="size-3.5" /> Regenerate
              </Button>
            </CardContent>
          </Card>

          {/* A4 preview — the only part printed when exporting to PDF */}
          <div className="overflow-x-auto rounded-xl bg-muted/40 p-4">
            <div className="print-area mx-auto w-[794px] max-w-none space-y-5 bg-white p-12 text-[13px] leading-relaxed text-slate-900 shadow-lg">
              <div className="flex items-start justify-between gap-6 text-[12px]">
                <div className="text-center">
                  <p className="font-bold">NGÂN HÀNG TMCP NAM Á</p>
                  <p className="font-bold">KHỐI TUÂN THỦ</p>
                  <p className="mt-1">Số: {reportNo}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="font-semibold underline underline-offset-4">
                    Độc lập – Tự do – Hạnh phúc
                  </p>
                  <p className="mt-1 italic">
                    TP. Hồ Chí Minh, ngày {format(now, "dd")} tháng{" "}
                    {format(now, "MM")} năm {format(now, "yyyy")}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold uppercase">
                  {template.name}
                </p>
                <p className="font-semibold">Kỳ báo cáo: {period}</p>
                <p className="italic">
                  Kính gửi: {RECIPIENT_LABEL[template.recipient]}
                </p>
              </div>

              <section>
                <p className="font-bold">I. TÓM TẮT</p>
                <p className="mt-1 text-justify">{narrative}</p>
              </section>

              <section>
                <p className="font-bold">II. CÁC CHỈ SỐ CHÍNH</p>
                <table className="mt-2 w-full border-collapse text-[12px]">
                  <tbody>
                    {[
                      ["Văn bản pháp luật mới tiếp nhận", data.lu.length],
                      [
                        "QĐNB đang điều chỉnh",
                        data.rv.length - data.issued.length,
                      ],
                      [
                        "QĐNB quá hạn / nguy cơ chậm ban hành",
                        `${data.overdueRev.length} / ${data.lateRisk.length}`,
                      ],
                      ["Vấn đề tuân thủ đang mở", data.open.length],
                      ["Trong đó mức rủi ro Cao", data.high.length],
                      ["Vấn đề quá hạn khắc phục", data.overdueIssues.length],
                      ["Số lần leo thang (cấp 2–3)", data.escalations.length],
                    ].map(([k, v]) => (
                      <tr key={k as string}>
                        <td className="border border-slate-300 px-2 py-1">
                          {k}
                        </td>
                        <td className="w-24 border border-slate-300 px-2 py-1 text-right font-semibold">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section>
                <p className="font-bold">
                  III. TIẾN ĐỘ CẬP NHẬT QUY ĐỊNH NỘI BỘ
                </p>
                <table className="mt-2 w-full border-collapse text-[11.5px]">
                  <thead>
                    <tr className="bg-slate-100">
                      {[
                        "QĐNB",
                        "Đơn vị chủ trì",
                        "Trạng thái",
                        "Hạn",
                        "Cảnh báo",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border border-slate-300 px-2 py-1 text-left"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rv
                      .filter((r) => r.status !== "issued")
                      .map((r) => (
                        <tr key={r.id}>
                          <td className="border border-slate-300 px-2 py-1">
                            {r.qdnbCode}
                            <br />
                            <span className="text-slate-500">
                              {r.qdnbTitle}
                            </span>
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            {r.leadUnitName}
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            {REVISION_STATUS_LABELS[r.status]}
                          </td>
                          <td className="border border-slate-300 px-2 py-1">
                            {format(parseISO(r.committedDate), "dd/MM/yyyy")}
                          </td>
                          <td
                            className={cn(
                              "border border-slate-300 px-2 py-1 font-semibold",
                              r.health === "overdue"
                                ? "text-red-700"
                                : r.health === "late_risk"
                                  ? "text-amber-700"
                                  : "text-green-700",
                            )}
                          >
                            {r.health === "overdue"
                              ? "Quá hạn"
                              : r.health === "late_risk"
                                ? "Nguy cơ chậm"
                                : "Đúng tiến độ"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </section>

              <section>
                <p className="font-bold">IV. VẤN ĐỀ TUÂN THỦ MỨC RỦI RO CAO</p>
                <ol className="mt-1 list-decimal space-y-1 pl-5">
                  {data.high.map((i) => (
                    <li key={i.id}>
                      {i.title} — {i.ownerUnitName} (
                      {ISSUE_SOURCE_SHORT[i.source]}), hạn{" "}
                      {format(parseISO(i.dueDate), "dd/MM/yyyy")}.
                    </li>
                  ))}
                  {!data.high.length && <li>Không có vấn đề mức Cao.</li>}
                </ol>
                <p className="mt-2">
                  Phân bổ theo nguồn:{" "}
                  {data.bySource.map(([k, v]) => `${k} ${v}`).join("; ")}.
                </p>
              </section>

              {template.sections.length > 0 && (
                <p className="text-[11px] text-slate-500">
                  Cấu trúc biểu mẫu: {template.sections.join(" · ")}
                </p>
              )}

              <div className="flex justify-between pt-6 text-[12px]">
                <div>
                  <p className="font-bold italic">Nơi nhận:</p>
                  <p>- {RECIPIENT_LABEL[template.recipient]};</p>
                  <p>- Lưu: Khối Tuân thủ.</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">GIÁM ĐỐC KHỐI TUÂN THỦ</p>
                  <p className="mt-14 font-semibold">{user?.name ?? ""}</p>
                </div>
              </div>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5" /> Preview uses live data at the demo
            date {format(now, "dd/MM/yyyy")}. <Download className="size-3.5" />{" "}
            PDF opens the print dialog — choose “Save as PDF”.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({
  s,
  t,
  onSubmit,
}: {
  s: ScheduledReport;
  t?: ReportTemplate;
  onSubmit: () => void;
}) {
  const d = daysUntil(s.dueDate);
  return (
    <div className="rounded-lg border border-border p-2.5 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-semibold">{t?.code}</span>
        <span className="text-xs">{s.period}</span>
        <span className="ml-auto">
          {s.status === "submitted" ? (
            <ToneBadge tone="success" icon={CheckCircle2}>
              Submitted
            </ToneBadge>
          ) : s.status === "draft" ? (
            <ToneBadge tone="warning">Draft</ToneBadge>
          ) : (
            <ToneBadge tone="neutral">Upcoming</ToneBadge>
          )}
        </span>
      </div>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
        {t?.name}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            s.status !== "submitted" && d < 0 && "font-semibold text-danger",
            s.status !== "submitted" && d >= 0 && d <= 10 && "text-warning",
          )}
        >
          {s.status === "submitted"
            ? `by ${s.submittedBy}`
            : `Due ${format(parseISO(s.dueDate), "dd/MM/yyyy")} (${d < 0 ? `${-d}d late` : `${d}d`})`}
        </span>
        {s.status !== "submitted" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={onSubmit}
          >
            <Send className="size-3" /> Mark submitted
          </Button>
        )}
      </div>
    </div>
  );
}
