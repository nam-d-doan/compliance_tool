import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  Users,
  UserCheck,
  Mail,
  UserX,
  Search,
  Plus,
  Pencil,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { KPICard } from "@/components/common/KPICard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import {
  useCreateUser,
  useUpdateUser,
} from "@/hooks/mutations/useAdminMutations";
import { USER_STATUSES, type UserStatus } from "@/constants/status";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UserProfile } from "@/types";

const ROLES = ["admin", "executive", "owner", "approver"] as const;
const PAGE_SIZE = 10;
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(ROLES),
  department: z.string().min(1, "Department is required"),
  businessUnit: z.string().min(1, "Business unit is required"),
  status: z.enum(USER_STATUSES),
});

type UserFormValues = z.infer<typeof userSchema>;

function UserForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema as never) as Resolver<UserFormValues>,
    defaultValues: {
      role: "owner",
      status: "Active",
      department: "",
      businessUnit: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          {...register("name")}
          aria-invalid={errors.name ? "true" : "false"}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <select id="role" {...field} className={selectClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          {...register("department")}
          aria-invalid={errors.department ? "true" : "false"}
        />
        {errors.department && (
          <p className="text-xs text-destructive">
            {errors.department.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessUnit">Business Unit</Label>
        <Input
          id="businessUnit"
          {...register("businessUnit")}
          aria-invalid={errors.businessUnit ? "true" : "false"}
        />
        {errors.businessUnit && (
          <p className="text-xs text-destructive">
            {errors.businessUnit.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select id="status" {...field} className={selectClass}>
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        />
      </div>
      <SheetFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}

function StatusButton({ user }: { user: UserProfile }) {
  const mutation = useUpdateUser();
  const nextStatus: UserStatus =
    user.status === "Active" ? "Deactivated" : "Active";
  return (
    <Button
      variant={user.status === "Active" ? "outline" : "secondary"}
      size="xs"
      disabled={mutation.isPending}
      onClick={() =>
        mutation.mutate(
          {
            id: user.id,
            data: { status: nextStatus, isActive: nextStatus === "Active" },
          },
          {
            onSuccess: () =>
              toast.success(`${user.name} is now ${nextStatus.toLowerCase()}`),
            onError: (err) =>
              toast.error(err.message || "Failed to update status"),
          },
        )
      }
    >
      {mutation.isPending && (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      )}
      {user.status === "Active" ? "Deactivate" : "Activate"}
    </Button>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status, department]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      role: role || undefined,
      status: status || undefined,
      department: department || undefined,
    }),
    [debouncedSearch, role, status, department],
  );

  const { data, isPending, isError, refetch } = useAdminUsers(
    page,
    PAGE_SIZE,
    filters,
  );
  const { data: allUsersData } = useAdminUsers(1, 1000);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          (allUsersData?.items ?? []).map((u) => u.department).filter(Boolean),
        ),
      ).sort(),
    [allUsersData],
  );

  const kpis = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.total ?? 0,
      active: items.filter((u) => u.status === "Active").length,
      invited: items.filter((u) => u.status === "Invited").length,
      deactivated: items.filter((u) => u.status === "Deactivated").length,
    };
  }, [data]);

  const handleInvite = (values: UserFormValues) => {
    createUser.mutate(
      { ...values, isActive: values.status === "Active" },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${values.email}`);
          setIsInviteOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to invite user"),
      },
    );
  };

  const handleEdit = (values: UserFormValues) => {
    if (!editingUser) return;
    updateUser.mutate(
      {
        id: editingUser.id,
        data: { ...values, isActive: values.status === "Active" },
      },
      {
        onSuccess: () => {
          toast.success(`${values.name} updated`);
          setEditingUser(null);
        },
        onError: (err) => toast.error(err.message || "Failed to update user"),
      },
    );
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-[20px] bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-6 text-white shadow-lg sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          User Management
        </h1>
        <p className="mt-1 text-sm text-[#dcecff]">
          Invite, manage, and deactivate users across the organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Users"
          value={kpis.total}
          icon={Users}
          loading={isPending}
        />
        <KPICard
          label="Active Users"
          value={kpis.active}
          icon={UserCheck}
          loading={isPending}
          subtitle="on this page"
        />
        <KPICard
          label="Invited"
          value={kpis.invited}
          icon={Mail}
          loading={isPending}
          subtitle="on this page"
        />
        <KPICard
          label="Deactivated"
          value={kpis.deactivated}
          icon={UserX}
          loading={isPending}
          subtitle="on this page"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm font-medium">Filters</CardTitle>
            <Sheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <SheetTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  Invite User
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Invite User</SheetTitle>
                  <SheetDescription>
                    Send an invitation and assign an initial role and
                    department.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                  <UserForm
                    defaultValues={{ status: "Invited" }}
                    onSubmit={handleInvite}
                    isSubmitting={createUser.isPending}
                    submitLabel="Send Invite"
                    onCancel={() => setIsInviteOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search name, email, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectClass}
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={selectClass}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <div className="p-4">
                <TableSkeleton rows={PAGE_SIZE} columns={8} />
              </div>
            ) : data?.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No users found"
                  description="Try adjusting your filters or invite a new user."
                  action={
                    <Button onClick={() => setIsInviteOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Invite User
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Role</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Business Unit
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Last Login
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {user.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap capitalize">
                          {user.role}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.department ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.businessUnit ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={user.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.lastLogin
                            ? format(new Date(user.lastLogin), "MMM d, yyyy")
                            : "Never"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditingUser(user)}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <StatusButton user={user} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isPending && data && data.total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Showing {(data.page - 1) * data.pageSize + 1} -{" "}
                  {Math.min(data.page * data.pageSize, data.total)} of{" "}
                  {data.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Sheet
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>
              Update role, department, and status for {editingUser?.name}.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {editingUser && (
              <UserForm
                key={editingUser.id}
                defaultValues={{
                  name: editingUser.name,
                  email: editingUser.email,
                  role: editingUser.role,
                  department: editingUser.department ?? "",
                  businessUnit: editingUser.businessUnit ?? "",
                  status: editingUser.status,
                }}
                onSubmit={handleEdit}
                isSubmitting={updateUser.isPending}
                submitLabel="Save Changes"
                onCancel={() => setEditingUser(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
