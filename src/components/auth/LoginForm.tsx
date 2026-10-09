import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { DEMO_USERS } from "@/constants/demo-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuthT, isAuthKey } from "@/constants/i18n/auth";
import { useTerm } from "@/lib/i18n";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "emailRequired")
    .email("emailInvalid"),
  password: z
    .string()
    .min(1, "passwordRequired")
    .min(8, "passwordMin"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { t } = useAuthT();
  const term = useTerm();
  const { setPendingUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    // Compatibility shim: @hookform/resolvers currently targets Zod 3 types while the project uses Zod 4.
    resolver: zodResolver(loginSchema as never) as Resolver<LoginFormValues>,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await AuthService.login(values.email, values.password);

      if (result.requiresMfa) {
        setPendingUser(result.user);
        navigate("/mfa", { replace: true });
        return;
      }

      const { login } = useAuthStore.getState();
      login(result.user, result.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("genericError");
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (email: string) => {
    setValue("email", email);
    setValue("password", "demo1234");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("welcome")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("signInSubtitle")}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {formError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="h-10 pl-10"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={errors.email ? "true" : "false"}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{isAuthKey(errors.email.message) ? t(errors.email.message) : errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-10 pl-10 pr-10"
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {isAuthKey(errors.password.message)
                ? t(errors.password.message)
                : errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true)
              }
              disabled={isLoading}
            />
            <Label
              htmlFor="rememberMe"
              className="cursor-pointer font-normal text-muted-foreground"
            >
              {t("rememberMe")}
            </Label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("forgotPasswordLink")}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("signingIn")}
            </>
          ) : (
            t("signIn")
          )}
        </Button>
      </form>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowDemoAccounts((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg border border-dashed p-3 text-sm transition-colors hover:bg-muted/50"
        >
          <span className="font-medium text-foreground">{t("demoAccounts")}</span>
          {showDemoAccounts ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {showDemoAccounts && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("demoPassword")}{" "}
                  <span className="font-medium text-foreground">demo1234</span>
                </p>
                <div className="grid gap-2">
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => fillDemoAccount(user.email)}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="text-foreground">{user.email}</span>
                      <span className="capitalize text-muted-foreground">
                        {term(user.role)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {t("termsNote")}
      </p>
    </motion.div>
  );
}
