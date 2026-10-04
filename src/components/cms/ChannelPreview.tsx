import { format, parseISO } from "date-fns";
import { Mail, MessageSquare, Smartphone } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

/**
 * Preview of how an alert reaches a department by email / Microsoft Teams /
 * SMS (RFQ 1.3 — "gửi thông báo/nhắc nhở đến các Phòng/Ban").
 */
export function ChannelPreview({
  notification,
  onOpenChange,
}: {
  notification: Notification | null;
  onOpenChange: (open: boolean) => void;
}) {
  const n = notification;
  const channels = n?.channels ?? ["in_app"];
  const link = n?.actionUrl
    ? `https://cms.namabank.com.vn${n.actionUrl}`
    : "https://cms.namabank.com.vn";
  return (
    <Sheet open={Boolean(n)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Message preview</SheetTitle>
          <SheetDescription>
            What the recipient receives on each channel. Sent automatically by
            the CMS — no manual email needed.
          </SheetDescription>
        </SheetHeader>
        {n && (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
            {channels.includes("email") && (
              <div className="overflow-hidden rounded-xl border border-border bg-white text-slate-800 shadow-sm">
                <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2 text-xs text-slate-500">
                  <Mail className="size-3.5" /> Email
                </div>
                <div className="space-y-1 px-4 pt-3 text-xs text-slate-500">
                  <p>
                    <b>From:</b> CMS Nam A Bank
                    &lt;cms-noreply@namabank.com.vn&gt;
                  </p>
                  <p>
                    <b>To:</b> {n.recipient ?? "Khối Tuân thủ"}
                  </p>
                  <p>
                    <b>Subject:</b> [CMS] {n.title}
                  </p>
                </div>
                <div className="space-y-3 px-4 py-4 text-sm">
                  <div className="h-1 w-16 rounded bg-[#00a651]" />
                  <p>Kính gửi {n.recipient ?? "Quý Phòng/Ban"},</p>
                  <p>{n.description}</p>
                  <a
                    href={link}
                    onClick={(e) => e.preventDefault()}
                    className="inline-block rounded-md bg-[#0b2748] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Mở trên hệ thống CMS
                  </a>
                  <p className="text-xs text-slate-500">
                    Email tự động từ Hệ thống Quản lý Tuân thủ — vui lòng không
                    trả lời.
                  </p>
                </div>
              </div>
            )}
            {channels.includes("teams") && (
              <div className="overflow-hidden rounded-xl border border-border bg-[#f5f5f5] text-slate-800 shadow-sm">
                <div className="flex items-center gap-2 border-b bg-[#464775] px-4 py-2 text-xs text-white">
                  <MessageSquare className="size-3.5" /> Microsoft Teams · CMS
                  Bot
                </div>
                <div className="p-4">
                  <div className="rounded-lg border-l-4 border-[#6264a7] bg-white p-3 shadow-sm">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {n.description}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded border border-[#6264a7] px-2 py-1 text-xs text-[#6264a7]">
                        Open in CMS
                      </span>
                      <span className="rounded border border-slate-300 px-2 py-1 text-xs">
                        Acknowledge
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {format(parseISO(n.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            )}
            {channels.includes("sms") && (
              <div className="mx-auto w-64 rounded-[2rem] border-4 border-slate-800 bg-slate-100 p-3 text-slate-800">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Smartphone className="size-3" /> SMS · NAMABANK
                </div>
                <p className="mt-2 rounded-2xl bg-white p-2.5 text-xs shadow-sm">
                  [CMS] {n.title}. Chi tiet: {link}
                </p>
              </div>
            )}
            <div
              className={cn(
                "rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground",
              )}
            >
              Channels: {channels.join(", ")} · Recipient: {n.recipient ?? "—"}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
