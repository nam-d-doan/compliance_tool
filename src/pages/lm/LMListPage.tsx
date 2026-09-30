/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ1: chỉ list + filter + xóa, chưa có KPI/chart (đó là GĐ4).
 * 2. Filter state → useLMCaseList (server filter qua query string).
 * 3. canCreate/canDelete theo lm:create / lm:delete.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
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
import { useAuthStore } from "@/stores";
import { useLMCaseList } from "@/hooks/queries";
import { useDeleteLMCase } from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import {
  CASE_STAGES,
  STAGE_STYLES,
  CASE_CATEGORY_LABELS,
  type CaseStage,
} from "@/constants/lm";
import { PRIORITY_LEVELS } from "@/constants/status";
import { toast } from "sonner";
import type { LMCaseFilter } from "@/types";

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function LMListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "lm:create");
  const canDelete = hasPermission(role, "lm:delete");

  const [filters, setFilters] = useState<LMCaseFilter>({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isPending, isError, refetch } = useLMCaseList(
    filters,
    page,
    pageSize,
  );
  const remove = useDeleteLMCase(filters);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters((f) => ({ ...f, search: searchInput || undefined }));
  };

  const handleDelete = (id: string, code: string) => {
    if (!window.confirm(`Xóa hồ sơ ${code}? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    remove.mutate(id, {
      onSuccess: () => toast.success(`Đã xóa hồ sơ ${code}`),
      onError: (err) => toast.error(err.message || "Xóa thất bại"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Hồ sơ Tố tụng & Thi hành án"
        subtitle="Quản lý hồ sơ tố tụng, thi hành án của ngân hàng."
      >
        {canCreate && (
          <Button asChild>
            <Link to="/lm/create">
              <Plus className="size-4" aria-hidden="true" />
              Tạo hồ sơ
            </Link>
          </Button>
        )}
      </PageHero>

      <form
        onSubmit={applySearch}
        className="flex flex-wrap items-center gap-3"
      >
        <Input
          placeholder="Tìm theo mã, tiêu đề, khách hàng..."
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
          <option value="">Tất cả giai đoạn</option>
          {CASE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_STYLES[s].label}
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
          <option value="">Tất cả ưu tiên</option>
          {PRIORITY_LEVELS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
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
          <option value="">Tất cả trạng thái</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </select>
        <Button type="submit" variant="outline">
          Lọc
        </Button>
      </form>

      {isPending ? (
        <TableSkeleton rows={8} columns={7} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Chưa có hồ sơ nào"
          description="Tạo hồ sơ đầu tiên hoặc bỏ bớt bộ lọc."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Mã hồ sơ</th>
                <th className="px-3 py-2">Tiêu đề</th>
                <th className="px-3 py-2">Nhóm</th>
                <th className="px-3 py-2">Giai đoạn</th>
                <th className="px-3 py-2">Ưu tiên</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Chuyên viên</th>
                <th className="px-3 py-2">Cập nhật</th>
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
                    {CASE_CATEGORY_LABELS[c.category]}
                  </td>
                  <td className="px-3 py-2">{STAGE_STYLES[c.stage].label}</td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2">{c.ownerName}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {format(parseISO(c.updatedAt), "MMM d, yyyy")}
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
                        aria-label={`Xóa hồ sơ ${c.code}`}
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
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page}/{totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
