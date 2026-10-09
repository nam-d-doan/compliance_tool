import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AuthService } from "@/services/auth_service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Resolver } from "react-hook-form";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuthT, isAuthKey } from "@/constants/i18n/auth";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "emailRequired")
    .email("emailInvalid"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { t } = useAuthT();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    // Compatibility shim: @hookform/resolvers currently targets Zod 3 types while the project uses Zod 4.
    resolver: zodResolver(
      forgotPasswordSchema as never,
    ) as Resolver<ForgotPasswordFormValues>,
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    setFormError(null);

    try {
      await AuthService.forgotPassword(values.email);
      setIsSuccess(true);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("forgotTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("forgotSubtitle")}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center rounded-xl border bg-muted/30 p-6 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                {t("checkEmail")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("resetSent")}
              </p>
            </div>

            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              <ArrowLeft className="size-4" />
              {t("backToSignIn")}
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {formError && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

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
                  <p className="text-xs text-destructive">
                    {isAuthKey(errors.email.message)
                      ? t(errors.email.message)
                      : errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("sending")}
                  </>
                ) : (
                  t("sendResetLink")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                {t("backToSignIn")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
