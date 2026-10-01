/**
 * PSEUDO CODE (ngắn gọn) — Khai thác Tri thức (GĐ3, Phụ lục 3 mục 1.c)
 * 1. List + ô tìm theo từ khóa (server lọc title/summary/tags qua q.search
 *    — xem handleGetKnowledgeBaseList). Không phân trang (kho nhỏ, demo).
 * 2. "New Entry" mở Sheet với form đơn giản — không tái dùng LawForm vì
 *    không có org-unit/owner/manager, field hoàn toàn khác.
 * 3. Không có trang chi tiết/sửa ở GĐ3 — chỉ thêm, đúng phạm vi kế hoạch
 *    (docs/law/00-decisions.md GĐ3).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHero, EmptyState, ErrorState, DetailSkeleton } from "@/components/common";
import { useKnowledgeBaseList } from "@/hooks/queries";
import { useCreateKnowledgeBaseEntry } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type { CreateKnowledgeBaseEntryInput } from "@/types";

interface KbFormValues {
  title: string;
  category: string;
  tags: string;
  summary: string;
  content: string;
}

export default function LawKnowledgeBasePage() {
  const { role, user } = useAuthStore();
  const canCreate = hasPermission(role, "law:create");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isPending, isError, refetch } = useKnowledgeBaseList(search);
  const create = useCreateKnowledgeBaseEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KbFormValues>({
    defaultValues: { title: "", category: "", tags: "", summary: "", content: "" },
  });

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const onCreate = (values: KbFormValues) => {
    const payload: CreateKnowledgeBaseEntryInput = {
      title: values.title,
      category: values.category || "Other",
      summary: values.summary,
      content: values.content,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      authorId: user?.id,
      authorName: user?.name,
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success("Entry added to Knowledge Base");
        setCreateOpen(false);
        reset();
      },
      onError: (err) => toast.error(err.message || "Failed to add entry"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Knowledge Base"
        subtitle="Sample advisory opinions and internal precedents — search before writing a new opinion to avoid duplication."
      >
        <Button variant="outline" asChild>
          <Link to="/law">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Requests
          </Link>
        </Button>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New Entry
          </Button>
        )}
      </PageHero>

      <form onSubmit={applySearch} className="flex items-center gap-3">
        <Input
          placeholder="Search by title, summary, or tag..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {isPending ? (
        <DetailSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No entries found"
          description="Try a different keyword or add the first entry."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="text-base">{entry.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{entry.summary}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {entry.category}
                  </span>
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.authorName} · {format(parseISO(entry.createdAt), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>New Knowledge Base Entry</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                {...register("title", { required: "Title is required" })}
                aria-invalid={errors.title ? "true" : "false"}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-category">Category</Label>
              <Input id="kb-category" {...register("category")} placeholder="e.g. Collateral" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-tags">Tags (comma separated)</Label>
              <Input id="kb-tags" {...register("tags")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-summary">Summary</Label>
              <Textarea
                id="kb-summary"
                {...register("summary", { required: "Summary is required" })}
                className="min-h-[4rem]"
                aria-invalid={errors.summary ? "true" : "false"}
              />
              {errors.summary && (
                <p className="text-xs text-destructive">{errors.summary.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-content">Full Content</Label>
              <Textarea
                id="kb-content"
                {...register("content", { required: "Content is required" })}
                className="min-h-[8rem]"
                aria-invalid={errors.content ? "true" : "false"}
              />
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={create.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                Add Entry
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
