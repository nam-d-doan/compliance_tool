import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  Shield,
  Users,
  Check,
  X,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHero } from "@/components/common";
import { useAdminRoles } from "@/hooks/queries/useAdminQueries";
import { useCreateRole } from "@/hooks/mutations/useAdminMutations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Permission, RoleEntity } from "@/types";

const PERMISSIONS: { value: Permission; label: string; description: string }[] =
  [
    { value: "view", label: "View", description: "Read data across modules" },
    { value: "create", label: "Create", description: "Create new records" },
    { value: "update", label: "Update", description: "Edit existing records" },
    { value: "delete", label: "Delete", description: "Remove records" },
    {
      value: "approve",
      label: "Approve",
      description: "Approve submissions and plans",
    },
    {
      value: "export",
      label: "Export",
      description: "Export reports and data",
    },
    {
      value: "manage_users",
      label: "Manage Users",
      description: "Invite and manage users",
    },
    {
      value: "manage_ai",
      label: "Manage AI",
      description: "Configure AI settings",
    },
    {
      value: "system_config",
      label: "System Config",
      description: "Manage organization and system settings",
    },
  ];

const roleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().min(5, "Description is required"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

function RoleCard({
  role,
  selected,
  onClick,
}: {
  role: RoleEntity;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{role.name}</h3>
            <p className="text-xs text-muted-foreground">{role.description}</p>
          </div>
        </div>
        {role.isSystem && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            System
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3.5" aria-hidden="true" />
          {role.userCount} users
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
          {role.permissions.length} permissions
        </span>
      </div>
    </motion.button>
  );
}

function PermissionMatrix({ role }: { role: RoleEntity }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
          <p className="text-sm text-muted-foreground">{role.description}</p>
        </div>
        {role.isSystem && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            System Role
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Permission</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-center font-medium">Granted</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((permission) => {
              const granted = role.permissions.includes(permission.value);
              return (
                <tr
                  key={permission.value}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {permission.label}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {permission.description}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {granted ? (
                      <Check
                        className="inline size-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <X
                        className="inline size-4 text-muted-foreground/50"
                        aria-hidden="true"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        This matrix is read-only in the demo. Production roles can be edited
        with granular module-level permissions.
      </p>
    </div>
  );
}

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState<RoleEntity | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: roles, isPending, isError, refetch } = useAdminRoles();
  const createRole = useCreateRole();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema as never) as Resolver<RoleFormValues>,
    defaultValues: {
      name: "",
      description: "",
      permissions: ["view"],
    },
  });

  const handleCreate = (values: RoleFormValues) => {
    createRole.mutate(
      {
        name: values.name,
        description: values.description,
        permissions: values.permissions as Permission[],
        isSystem: false,
        userCount: 0,
      },
      {
        onSuccess: () => {
          toast.success(`Role "${values.name}" created`);
          setIsCreateOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to create role"),
      },
    );
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Role Management"
        subtitle="Review default roles and create custom roles for the organization."
      >
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              Create Role
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Create Role</SheetTitle>
              <SheetDescription>
                Define a new role with a name, description, and permissions.
              </SheetDescription>
            </SheetHeader>
            <form
              onSubmit={handleSubmit(handleCreate)}
              className="space-y-4 px-4 pb-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
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
              <div className="space-y-2">
                <Label>Permissions</Label>
                <Controller
                  name="permissions"
                  control={control}
                  render={({ field }) => (
                    <div className="grid gap-2">
                      {PERMISSIONS.map((permission) => {
                        const checked = field.value.includes(permission.value);
                        return (
                          <label
                            key={permission.value}
                            className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 size-4 rounded border-input"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...field.value, permission.value]
                                  : field.value.filter(
                                      (p) => p !== permission.value,
                                    );
                                field.onChange(next);
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {permission.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.permissions && (
                  <p className="text-xs text-destructive">
                    {errors.permissions.message}
                  </p>
                )}
              </div>
              <SheetFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createRole.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRole.isPending}>
                  {createRole.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  Create Role
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </PageHero>

      {isPending ? (
        <LoadingState message="Loading roles..." />
      ) : roles && roles.length === 0 ? (
        <EmptyState
          title="No roles found"
          description="Create a new role to get started."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Create Role
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            {roles?.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                selected={selectedRole?.id === role.id}
                onClick={() => setSelectedRole(role)}
              />
            ))}
          </div>
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              {selectedRole ? (
                <PermissionMatrix role={selectedRole} />
              ) : (
                <EmptyState
                  title="Select a role"
                  description="Click a role card to view its permission matrix."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
