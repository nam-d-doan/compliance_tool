/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ1: chỉ list + filter + xóa, chưa có KPI/chart/cảnh báo (GĐ3-4).
 * 2. Filter state → useLawRequestList (server filter qua query string).
 * 3. canCreate/canDelete theo law:create / law:delete.
 * 4. GĐ2: cột "Due Date" đọc dueDate server tính sẵn lúc tạo (theo SLA).
 * 5. GĐ3: chấm màu "Alert" đọc severity server tính sẵn (không tự tính ở
 *   FE, giống cột Cảnh báo của LM). Nút "Knowledge Base" sang trang tra
 *   cứu tri thức riêng.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHero,
  DueDateCell,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/common";
import { useAuthStore } from "@/stores";
import { useLawRequestList } from "@/hooks/queries";
import { useDeleteLawRequest } from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import {
  LAW_PRIORITY_TIERS,
  LAW_PRIORITY_STYLES,
  LAW_REQUEST_STATUSES,
  LAW_STATUS_LABELS,
  type LawRequestStatus,
} from "@/constants/law";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LawRequestFilter } from "@/types";
import { useL, useTerm, useDateLocale } from "@/lib/i18n";

const SEVERITY_DOT: Record<string, string> = {
  red: "bg-destructive",
  amber: "bg-warning",
  none: "bg-muted-foreground/30",
};

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function LawListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "law:create");
  const canDelete = hasPermission(role, "law:delete");
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();

  const [filters, setFilters] = useState<LawRequestFilter>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isPending, isError, refetch } = useLawRequestList(
    filters,
    page,
    pageSize,
  );
  const remove = useDeleteLawRequest(filters);

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
          `Delete request ${code}? This action cannot be undone.`,
          `Xoá yêu cầu ${code}? Không thể hoàn tác.`,
        ),
      )
    ) {
      return;
    }
    remove.mutate(id, {
      onSuccess: () => toast.success(L(`Request ${code} deleted`, `Đã xoá yêu cầu ${code}`)),
      onError: (err) => toast.error(err.message || L("Delete failed", "Xoá thất bại")),
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title={L("Legal Advisory Requests", "Yêu cầu tư vấn pháp lý")}
        subtitle={L("Manage legal advisory requests from business units.", "Quản lý yêu cầu tư vấn pháp lý từ các đơn vị.")}
      >
        <Button variant="outline" asChild>
          <Link to="/law/knowledge-base">
            <BookOpen className="size-4" aria-hidden="true" />
            {L("Knowledge Base", "Kho tri thức")}
          </Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link to="/law/create">
              <Plus className="size-4" aria-hidden="true" />
              {L("New Request", "Tạo yêu cầu")}
            </Link>
          </Button>
        )}
      </PageHero>

      <form
        onSubmit={applySearch}
        className="flex flex-wrap items-center gap-3"
      >
        <Input
          placeholder={L("Search by code or title...", "Tìm theo mã hoặc tiêu đề...")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <select
          className={selectClass}
          value={(filters.priorityTier as string) ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({
              ...f,
              priorityTier: (e.target.value ||
                undefined) as LawRequestFilter["priorityTier"],
            }));
          }}
        >
          <option value="">{L("All priorities", "Tất cả mức ưu tiên")}</option>
          {LAW_PRIORITY_TIERS.map((t) => (
            <option key={t} value={t}>
              {term(LAW_PRIORITY_STYLES[t].label)}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={(filters.status as string) ?? ""}
          onChange={(e) => {
            setPage(1);
            setFilters((f) => ({
              ...f,
              status: (e.target.value || undefined) as LawRequestStatus | undefined,
            }));
          }}
        >
          <option value="">{L("All statuses", "Tất cả trạng thái")}</option>
          {LAW_REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {term(LAW_STATUS_LABELS[s])}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {L("Filter", "Lọc")}
        </Button>
      </form>

      {isPending ? (
        <TableSkeleton rows={8} columns={9} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={L("No requests yet", "Chưa có yêu cầu")}
          description={L("Create the first request or clear some filters.", "Tạo yêu cầu đầu tiên hoặc bỏ bớt bộ lọc.")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{L("Request Code", "Mã yêu cầu")}</th>
                <th className="px-3 py-2">{L("Title", "Tiêu đề")}</th>
                <th className="px-3 py-2">{L("Alert", "Cảnh báo")}</th>
                <th className="px-3 py-2">{L("Priority", "Ưu tiên")}</th>
                <th className="px-3 py-2">{L("Status", "Trạng thái")}</th>
                <th className="px-3 py-2">{L("Requesting Unit", "Đơn vị yêu cầu")}</th>
                <th className="px-3 py-2">{L("Specialist", "Chuyên viên")}</th>
                <th className="px-3 py-2">{L("Submitted", "Ngày gửi")}</th>
                <th className="px-3 py-2">{L("Due Date", "Hạn xử lý")}</th>
                {canDelete && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-t border-border hover:bg-muted/30"
                  onClick={() => navigate(`/law/${r.id}`)}
                >
                  <td className="px-3 py-2 font-medium">{r.code}</td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-block size-2 rounded-full",
                        SEVERITY_DOT[r.severity ?? "none"],
                      )}
                      aria-hidden="true"
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {term(LAW_PRIORITY_STYLES[r.priorityTier].label)}
                  </td>
                  <td className="px-3 py-2">{term(LAW_STATUS_LABELS[r.status])}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.requestingUnitName}
                  </td>
                  <td className="px-3 py-2">{r.ownerName}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {format(parseISO(r.submittedAt), "MMM d, yyyy", { locale: dateLocale })}
                  </td>
                  <td className="px-3 py-2">
                    <DueDateCell
                      dueDate={r.dueDate}
                      completed={r.status === "completed"}
                    />
                  </td>
                  {canDelete && (
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id, r.code);
                        }}
                        aria-label={L(`Delete request ${r.code}`, `Xoá yêu cầu ${r.code}`)}
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
