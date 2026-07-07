import { useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  FileUp,
  Loader2,
  Search,
  X,
  Plus,
  Trash2,
  BookOpen,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHero } from "@/components/common";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useCreateRegulation } from "@/hooks/mutations/useRegulationMutations";
import { useVietLexSearch } from "@/hooks/queries/useRegulationQueries";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type { VietLexDoc } from "@/types";

const CATEGORIES = [
  "AML/KYC",
  "Data Privacy",
  "Consumer Protection",
  "Market Conduct",
  "Operational Risk",
  "Capital Adequacy",
  "Cybersecurity",
  "Financial Reporting",
] as const;

const REGULATORS = [
  "Ngân hàng Nhà nước Việt Nam (SBV)",
  "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
  "Basel Committee on Banking Supervision",
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const ACCEPT_FILE_TYPES =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const articleSchema = z.object({
  id: z.string(),
  number: z.string(),
  title: z.string().min(1, "Article title is required"),
  summary: z.string().min(1, "Article summary is required"),
});

const formSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  category: z.string().min(1, "Category is required"),
  regulatoryBody: z.string().min(1, "Regulatory body is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expirationDate: z.string().optional(),
  priority: z.enum(PRIORITIES),
  articles: z
    .array(articleSchema)
    .min(1, "At least one article with title and summary is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ArticleInput {
  id: string;
  number: string;
  title: string;
  summary: string;
}

const VIETLEX_STUB_ARTICLES: ArticleInput[] = [
  {
    id: "art-1",
    number: "1",
    title: "Điều 1: Phạm vi điều chỉnh",
    summary:
      "Quy định phạm vi điều chỉnh của văn bản, bao gồm các tổ chức tín dụng, chi nhánh ngân hàng nước ngoài và các chủ thể liên quan.",
  },
  {
    id: "art-2",
    number: "2",
    title: "Điều 2: Đối tượng áp dụng",
    summary:
      "Xác định đối tượng phải tuân thủ các quy định tại văn bản này và điều kiện áp dụng theo từng loại hình tổ chức.",
  },
  {
    id: "art-3",
    number: "3",
    title: "Điều 3: Giải thích từ ngữ",
    summary:
      "Giải thích các thuật ngữ chuyên ngành được sử dụng trong toàn bộ văn bản để đảm bảo thống nhất về hiểu biết và áp dụng.",
  },
  {
    id: "art-4",
    number: "4",
    title: "Điều 4: Trách nhiệm của tổ chức tín dụng",
    summary:
      "Quy định trách nhiệm xây dựng quy trình nội bộ, phân công nhiệm vụ và báo cáo định kỳ cho cơ quan quản lý.",
  },
  {
    id: "art-5",
    number: "5",
    title: "Điều 5: Yêu cầu báo cáo",
    summary:
      "Nêu rõ nội dung, thờihạn và hình thức báo cáo mà tổ chức phải thực hiện theo quy định của pháp luật.",
  },
];

function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("an toàn vốn") || t.includes("capital")) return "Capital Adequacy";
  if (t.includes("rủi ro tín dụng") || t.includes("credit risk"))
    return "Operational Risk";
  if (t.includes("khủng bố") || t.includes("aml") || t.includes("kyc"))
    return "AML/KYC";
  if (t.includes("chứng khoán") || t.includes("securities"))
    return "Market Conduct";
  if (t.includes("công bố thông tin") || t.includes("privacy"))
    return "Data Privacy";
  if (t.includes("báo cáo") || t.includes("reporting"))
    return "Financial Reporting";
  return "Operational Risk";
}

export default function RegulationCreatePage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "regulation:create");

  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [articles, setArticles] = useState<ArticleInput[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      priority: "medium",
      articles: [],
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: vietlexResults, isPending: searching } =
    useVietLexSearch(searchQuery);

  const createRegulation = useCreateRegulation();

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const syncArticles = (next: ArticleInput[]) => {
    const renumbered = next.map((a, i) => ({ ...a, number: String(i + 1) }));
    setArticles(renumbered);
    setValue("articles", renumbered, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const baseName = selected.name.replace(/\.[^/.]+$/, "");
    setValue("title", baseName, { shouldValidate: false });
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExtractArticles = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    setExtracting(true);
    setTimeout(() => {
      syncArticles(VIETLEX_STUB_ARTICLES.slice(0, 5));
      setExtracting(false);
      toast.success("Articles extracted from document");
    }, 1200);
  };

  const updateArticle = (
    index: number,
    updates: Partial<ArticleInput>,
  ) => {
    const next = articles.map((a, i) =>
      i === index ? { ...a, ...updates } : a,
    );
    syncArticles(next);
  };

  const removeArticle = (index: number) => {
    const next = articles.filter((_, i) => i !== index);
    syncArticles(next);
  };

  const addArticle = () => {
    const next = [
      ...articles,
      {
        id: `art-${crypto.randomUUID()}`,
        number: String(articles.length + 1),
        title: "",
        summary: "",
      },
    ];
    syncArticles(next);
  };

  const handleImportVietLex = (doc: VietLexDoc) => {
    setValue("title", `${doc.docNumber} - ${doc.title}`, {
      shouldValidate: true,
    });
    setValue("description", doc.title, { shouldValidate: true });
    setValue("regulatoryBody", doc.issuer, { shouldValidate: true });
    setValue("effectiveDate", doc.date.slice(0, 10), { shouldValidate: true });
    setValue("category", inferCategory(doc.title), { shouldValidate: true });
    syncArticles(VIETLEX_STUB_ARTICLES.slice(0, 4));
    setActiveTab("upload");
    toast.success(`Imported ${doc.docNumber}`);
  };

  const submitForm = async (statusKey: "draft" | "published") => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fix the form errors");
      return;
    }
    handleSubmit((values) => {
      createRegulation.mutate(
        {
          ...values,
          status: statusKey === "draft" ? "Draft" : "Published",
          source: "internal",
        },
        {
          onSuccess: (data) => {
            toast.success(
              statusKey === "draft"
                ? "Regulation saved as draft"
                : "Regulation published",
            );
            navigate(`/regulation/${data.id}`);
          },
          onError: (err) =>
            toast.error(err.message || "Failed to save regulation"),
        },
      );
    })();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Create Regulation"
        subtitle="Upload a document or search VietLex to draft a new regulation."
      />

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload">
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload Document
          </TabsTrigger>
          <TabsTrigger value="vietlex">
            <BookOpen className="size-4" aria-hidden="true" />
            Search VietLex
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Document file (PDF/DOCX)</Label>
                <Input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_FILE_TYPES}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 px-6 py-8 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                  >
                    <FileUp className="size-6" aria-hidden="true" />
                    <span>Click to upload PDF or DOCX</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileUp className="size-5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">
                        {file.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleRemoveFile}
                    >
                      <X className="size-4" aria-hidden="true" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleExtractArticles}
                disabled={!file || extracting}
                className="w-full sm:w-auto"
              >
                {extracting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <BookOpen className="size-4" aria-hidden="true" />
                )}
                Extract Articles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vietlex">
          <Card>
            <CardHeader>
              <CardTitle>Search VietLex</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Search Vietnamese legal documents..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSearchQuery(searchInput.trim());
                    }}
                    className="pl-8"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => setSearchQuery(searchInput.trim())}
                  disabled={!searchInput.trim() || searching}
                >
                  {searching && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Search
                </Button>
              </div>

              {searchQuery ? (
                searching ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : vietlexResults && vietlexResults.length > 0 ? (
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {vietlexResults.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.docNumber}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <p className="truncate text-sm font-medium">
                            {doc.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.issuer}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleImportVietLex(doc)}
                          className="shrink-0"
                        >
                          Import
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No results"
                    description="Try a different keyword from the Vietnamese legal corpus."
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Enter a keyword and press Search to query VietLex.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Regulation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              aria-invalid={errors.title ? "true" : "false"}
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              aria-invalid={errors.description ? "true" : "false"}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select id="category" {...field} className={selectClass}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="regulatoryBody">Regulatory Body</Label>
              <Controller
                name="regulatoryBody"
                control={control}
                render={({ field }) => (
                  <select
                    id="regulatoryBody"
                    {...field}
                    className={selectClass}
                  >
                    <option value="">Select regulatory body</option>
                    {REGULATORS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.regulatoryBody && (
                <p className="text-xs text-destructive">
                  {errors.regulatoryBody.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register("effectiveDate")}
                aria-invalid={errors.effectiveDate ? "true" : "false"}
              />
              {errors.effectiveDate && (
                <p className="text-xs text-destructive">
                  {errors.effectiveDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">
                Expiration Date{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="expirationDate"
                type="date"
                {...register("expirationDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <select id="priority" {...field} className={selectClass}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.priority && (
                <p className="text-xs text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>

            <div className="flex items-end">
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <PriorityBadge priority={field.value} size="sm" />
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Articles</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addArticle}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Article
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.articles && !Array.isArray(errors.articles) && (
            <p className="text-xs text-destructive">
              {errors.articles.message}
            </p>
          )}

          {articles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              description="Upload a document, search VietLex, or add articles manually."
            />
          ) : (
            <div className="space-y-3">
              {articles.map((article, index) => (
                <div
                  key={article.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Điều {article.number}
                      </Badge>
                      <Input
                        value={article.title}
                        onChange={(e) =>
                          updateArticle(index, { title: e.target.value })
                        }
                        placeholder="Article title"
                        className="h-8"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeArticle(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">Remove article</span>
                    </Button>
                  </div>
                  <Textarea
                    value={article.summary}
                    onChange={(e) =>
                      updateArticle(index, { summary: e.target.value })
                    }
                    placeholder="Article summary"
                    className="min-h-[4rem]"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={createRegulation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => submitForm("draft")}
          disabled={createRegulation.isPending}
        >
          {createRegulation.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => submitForm("published")}
          disabled={createRegulation.isPending}
        >
          {createRegulation.isPending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          Publish
        </Button>
      </div>
    </motion.div>
  );
}
