/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ1: chỉ list + filter + xóa, chưa có KPI/chart (đó là GĐ4).
 * 2. Filter state → useLMCaseList (server filter qua query string).
 * 3. canCreate/canDelete theo lm:create / lm:delete.
 * 4. GĐ3: cột "Cảnh báo" đọc redFlagCount server tính sẵn (đếm hạn đang
 *    flagged) — không tự tính lại ở FE, tránh lệch với lib/deadline-alerts.ts.
 * 5. UI text tiếng Anh cho khớp phần còn lại của app (user yêu cầu) — chỉ
 *    đổi copy hiển thị, pseudo-code comment vẫn giữ tiếng Việt.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/common";
import { useAuthStore, useLanguageStore } from "@/stores";
import { useLMCaseList } from "@/hooks/queries";
import { useDeleteLMCase } from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import {
  CASE_STAGES,
  getStageLabel,
  getCaseCategoryLabel,
  type CaseStage,
} from "@/constants/lm";
import { PRIORITY_LEVELS } from "@/constants/status";
import { toast } from "sonner";
import type { LMCaseFilter } from "@/types";
import { useL, useTerm, useDateLocale } from "@/lib/i18n";

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function LMListPage() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  // Nam review: chuyên viên thụ lý chỉ thấy hồ sơ mình phụ trách — cùng
  // quy tắc với LMDashboardPage (isSpecialistView).
  const isSpecialistView = role === "owner";
  const canCreate = hasPermission(role, "lm:create");
  const canDelete = hasPermission(role, "lm:delete");
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  const lang = useLanguageStore((s) => s.lang);

  const [filters, setFilters] = useState<LMCaseFilter>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const scopedFilters: LMCaseFilter = isSpecialistView
    ? { ...filters, ownerId: user?.id }
    : filters;

  const { data, isPending, isError, refetch } = useLMCaseList(
    scopedFilters,
    page,
    pageSize,
  );
  const remove = useDeleteLMCase(scopedFilters);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters((f) => ({ ...f, search: searchInput || undefined }));
  };

  const handleDelete = (id: string, code: string) => {
    if (
      !window.confirm(
        L(
          `Delete case ${code}? This action cannot be undone.`,
          `Xoá hồ sơ ${code}? Không thể hoàn tác.`,
        ),
      )
    ) {
      return;
    }
    remove.mutate(id, {
      onSuccess: () => toast.success(L(`Case ${code} deleted`, `Đã xoá hồ sơ ${code}`)),
      onError: (err) => toast.error(err.message || L("Delete failed", "Xoá thất bại")),
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title={
          isSpecialistView
            ? L("My Cases", "Hồ sơ của tôi")
            : L("Litigation & Enforcement Cases", "Hồ sơ tố tụng & thi hành án")
        }
        subtitle={
          isSpecialistView
            ? L("Cases assigned to you.", "Các hồ sơ bạn đang phụ trách.")
            : L(
                "Manage the bank's litigation and judgment enforcement cases.",
                "Quản lý hồ sơ tố tụng và thi hành án của ngân hàng.",
              )
        }
      >
        {canCreate && (
          <Button asChild>
            <Link to="/lm/create">
              <Plus className="size-4" aria-hidden="true" />
              {L("New Case", "Tạo hồ sơ mới")}
            </Link>
          </Button>
        )}
      </PageHero>

      <form
        onSubmit={applySearch}
        className="flex flex-wrap items-center gap-3"
      >
        <Input
          placeholder={L("Search by code, title, customer...", "Tìm theo mã, tiêu đề, khách hàng...")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <select
          className={selectClass}
          value={(filters.stage as string) ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({
              ...f,
              stage: (e.target.value || undefined) as CaseStage | undefined,
            }));
          }}
        >
          <option value="">{L("All stages", "Tất cả giai đoạn")}</option>
          {CASE_STAGES.map((s) => (
            <option key={s} value={s}>
              {getStageLabel(s, lang)}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={(filters.priority as string) ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({
              ...f,
              priority: (e.target.value ||
                undefined) as LMCaseFilter["priority"],
            }));
          }}
        >
          <option value="">{L("All priorities", "Tất cả mức ưu tiên")}</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {term(p.charAt(0).toUpperCase() + p.slice(1))}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.status ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({
              ...f,
              status: (e.target.value ||
                undefined) as LMCaseFilter["status"],
            }));
          }}
        >
          <option value="">{L("All statuses", "Tất cả trạng thái")}</option>
          <option value="Open">{term("Open")}</option>
          <option value="Closed">{term("Closed")}</option>
        </select>
        <Button type="submit" variant="outline">
          {L("Filter", "Lọc")}
        </Button>
      </form>

      {isPending ? (
        <TableSkeleton rows={8} columns={8} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={L("No cases yet", "Chưa có hồ sơ")}
          description={L("Create the first case or clear some filters.", "Tạo hồ sơ đầu tiên hoặc bỏ bớt bộ lọc.")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{L("Case Code", "Mã hồ sơ")}</th>
                <th className="px-3 py-2">{L("Title", "Tiêu đề")}</th>
                <th className="px-3 py-2">{L("Category", "Nhóm vụ việc")}</th>
                <th className="px-3 py-2">{L("Stage", "Giai đoạn")}</th>
                <th className="px-3 py-2">{L("Alerts", "Cảnh báo")}</th>
                <th className="px-3 py-2">{L("Priority", "Ưu tiên")}</th>
                <th className="px-3 py-2">{L("Status", "Trạng thái")}</th>
                {!isSpecialistView && (
                  <th className="px-3 py-2">{L("Owner", "Chuyên viên")}</th>
                )}
                <th className="px-3 py-2">{L("Updated", "Cập nhật")}</th>
                {canDelete && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t border-border hover:bg-muted/30"
                  onClick={() => navigate(`/lm/${c.id}`)}
                >
                  <td className="px-3 py-2 font-medium">{c.code}</td>
                  <td className="px-3 py-2">{c.title}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {getCaseCategoryLabel(c.category, lang)}
                  </td>
                  <td className="px-3 py-2">{getStageLabel(c.stage, lang)}</td>
                  <td className="px-3 py-2">
                    {c.redFlagCount ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        <TriangleAlert className="size-3" aria-hidden="true" />
                        {c.redFlagCount}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  {!isSpecialistView && <td className="px-3 py-2">{c.ownerName}</td>}
                  <td className="px-3 py-2 text-muted-foreground">
                    {format(parseISO(c.updatedAt), "MMM d, yyyy", { locale: dateLocale })}
                  </td>
                  {canDelete && (
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id, c.code);
                        }}
                        aria-label={L(`Delete case ${c.code}`, `Xoá hồ sơ ${c.code}`)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {L("Previous", "Trước")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {L("Page", "Trang")} {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {L("Next", "Sau")}
          </Button>
        </div>
      )}
    </div>
  );
}
