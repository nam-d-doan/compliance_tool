import {
  Archive,
  Calendar,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Sparkles,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types";

export interface EvidenceCardProps {
  item: Evidence;
  onClick?: () => void;
  className?: string;
}

function fileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes("pdf") || type.includes("doc") || type.includes("txt"))
    return FileText;
  if (type.includes("xls") || type.includes("csv")) return FileSpreadsheet;
  if (
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg") ||
    type.includes("gif")
  )
    return Image;
  if (type.includes("zip") || type.includes("tar") || type.includes("gz"))
    return Archive;
  return File;
}

export function EvidenceCard({ item, onClick, className }: EvidenceCardProps) {
  const Icon = fileIcon(item.fileType);
  const aiDone =
    item.aiValidation.status === "completed" ||
    item.aiValidation.status === "suitable" ||
    item.aiValidation.status === "questionable" ||
    item.aiValidation.status === "insufficient" ||
    item.aiValidation.status === "wrong_document";

  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={cn(
          "group overflow-hidden transition-shadow hover:shadow-md",
          onClick && "cursor-pointer",
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="line-clamp-2 text-sm font-medium leading-snug">
                {item.name}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {item.category}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} size="sm" />
            {aiDone && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="size-3" aria-hidden="true" />
                AI {item.aiValidation.score}%
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" aria-hidden="true" />
              {item.ownerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {format(new Date(item.uploadDate), "MMM d, yyyy")}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
