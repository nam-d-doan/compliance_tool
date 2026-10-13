import { Check, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasPermission } from "@/constants/rbac";
import type { Role } from "@/types";

const ROLES: { role: Role; title: string; namA: string }[] = [
  { role: "admin", title: "Admin", namA: "System administrator" },
  {
    role: "executive",
    title: "Executive",
    namA: "Ban Điều hành / Ban Kiểm soát",
  },
  { role: "owner", title: "Owner", namA: "Compliance officer (Khối Tuân thủ)" },
  {
    role: "approver",
    title: "Approver",
    namA: "Head of department / division",
  },
];

const ROWS: { module: string; action: string; permission: string }[] = [
  {
    module: "Legal Updates",
    action: "View new legal documents",
    permission: "legal:read",
  },
  {
    module: "Legal Updates",
    action: "Decide applicability, map, assign",
    permission: "legal:review",
  },
  {
    module: "Internal Regs (QĐNB)",
    action: "View tracker & register",
    permission: "qdnb:read",
  },
  {
    module: "Internal Regs (QĐNB)",
    action: "Update progress, submit drafts, record issuance",
    permission: "qdnb:update",
  },
  {
    module: "Internal Regs (QĐNB)",
    action: "Approve revisions",
    permission: "qdnb:approve",
  },
  {
    module: "Issues (NCC)",
    action: "Record and edit issues",
    permission: "ncc:update",
  },
  {
    module: "Issues (NCC)",
    action: "Accept ICIS findings",
    permission: "icis:intake",
  },
  {
    module: "Issues (NCC)",
    action: "Review evidence, rate risk",
    permission: "issue:review",
  },
  {
    module: "Issues (NCC)",
    action: "Approve closure",
    permission: "issue:approve",
  },
  {
    module: "Escalation",
    action: "Acknowledge escalations",
    permission: "escalation:ack",
  },
  {
    module: "Risk Matrix",
    action: "Configure matrix & escalation rules",
    permission: "risk:configure",
  },
  {
    module: "Reports",
    action: "View and export management reports",
    permission: "report:read",
  },
];

/** Who can do what in the CMS modules (RFQ deliverable: user permission configuration). */
export function CmsAccessMatrix() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CMS module access matrix</CardTitle>
        <CardDescription>
          Ma trận phân quyền — demo roles mapped to Nam A Bank functions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Module</th>
                <th className="px-3 py-2 font-medium">Action</th>
                {ROLES.map((r) => (
                  <th key={r.role} className="px-3 py-2 text-center font-medium">
                    <span className="block text-foreground">{r.title}</span>
                    <span className="block text-[10px] font-normal">
                      {r.namA}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((row) => (
                <tr key={row.permission}>
                  <td className="px-3 py-2 font-medium">{row.module}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.action}
                  </td>
                  {ROLES.map((r) => (
                    <td key={r.role} className="px-3 py-2 text-center">
                      {hasPermission(r.role, row.permission) ? (
                        <Check
                          className="mx-auto size-4 text-success"
                          aria-label="Allowed"
                        />
                      ) : (
                        <Minus
                          className="mx-auto size-4 text-muted-foreground/40"
                          aria-label="Not allowed"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
