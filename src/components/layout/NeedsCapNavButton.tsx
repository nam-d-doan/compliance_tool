import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores";
import { useObligationList, useCAPList } from "@/hooks/queries";
import { getNeedsCapsForOwner } from "@/lib/obligation-helpers";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

/**
 * TopNav button shown to owners: surfaces the count of obligations that need a
 * Corrective Action Plan as a red badge, with a quick dropdown to create / open
 * a CAP directly. Renders nothing for non-owners or while data is loading.
 */
export function NeedsCapNavButton() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const ownerId = user?.id ?? "";

  const obligations = useObligationList(
    ownerId ? { owner: ownerId } : {},
    1,
    500,
  );
  const caps = useCAPList({}, 1, 500);

  const items = useMemo(
    () =>
      getNeedsCapsForOwner(
        obligations.data?.items ?? [],
        caps.data?.items ?? [],
      ),
    [obligations.data, caps.data],
  );

  // Only owners see this control, and only once data has resolved.
  if (role !== "owner") return null;
  if (obligations.isPending || caps.isPending) return null;

  const count = items.length;
  const visible = items.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={`Needs CAP — ${count} item${count === 1 ? "" : "s"}`}
        >
          <ClipboardCheck
            className={cn("size-5", count > 0 && "animate-shake")}
          />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Needs CAP</span>
          <Badge
            variant={count > 0 ? "destructive" : "secondary"}
            className="h-5"
          >
            {count}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <CheckCircle2 className="size-6 text-emerald-500" />
            <p className="text-sm font-medium">All clear</p>
            <p className="text-xs text-muted-foreground">
              No obligations need a corrective action plan right now.
            </p>
          </div>
        ) : (
          <>
            {visible.map((item) => (
              <DropdownMenuItem
                key={item.key}
                className="flex flex-col items-stretch gap-1 py-2"
                onSelect={(e) => {
                  // Prevent the menu from closing before navigation runs.
                  e.preventDefault();
                  if (item.hasCap && item.cap) {
                    navigate(`/cap/${item.cap.id}`);
                  } else {
                    navigate(
                      `/cap/create?obligations=${item.obligations
                        .map((o) => o.id)
                        .join(",")}`,
                    );
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {item.obligations.length} obg
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {item.hasCap ? (
                    <>
                      <ClipboardCheck className="size-3" /> Go to CAP
                    </>
                  ) : (
                    <>
                      <Plus className="size-3" /> Create CAP
                    </>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary focus:text-primary"
              onSelect={() => navigate(ROUTES.DASHBOARD.OWNER)}
            >
              View dashboard
              <ArrowRight className="size-3.5" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
