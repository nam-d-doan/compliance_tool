import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { AuthService } from "@/services/auth_service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";

const CODE_LENGTH = 6;

const mfaSchema = z.object({
  code: z.string().length(CODE_LENGTH, `Enter the ${CODE_LENGTH}-digit code`),
});

type MfaFormValues = z.infer<typeof mfaSchema>;

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MFAForm() {
  const navigate = useNavigate();
  const { pendingUser, clearPendingUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MfaFormValues>({
    // Compatibility shim: @hookform/resolvers currently targets Zod 3 types while the project uses Zod 4.
    resolver: zodResolver(mfaSchema as never) as Resolver<MfaFormValues>,
    defaultValues: {
      code: "",
    },
  });

  const code = watch("code");
  const digits = code.padEnd(CODE_LENGTH, "").split("");

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < CODE_LENGTH) {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    }
  }, []);

  const updateCode = useCallback(
    (newDigits: string[]) => {
      const newCode = newDigits.join("").slice(0, CODE_LENGTH);
      setValue("code", newCode, { shouldValidate: true });
    },
    [setValue],
  );

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    if (!digit) {
      const newDigits = [...digits];
      newDigits[index] = "";
      updateCode(newDigits);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    updateCode(newDigits);

    if (index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = "";
        updateCode(newDigits);
      } else if (index > 0) {
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
      return;
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    updateCode(newDigits);

    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    focusInput(nextIndex);
  };

  const handleResend = () => {
    if (!canResend) return;
    toast.success("Code resent", {
      description: "A new verification code has been sent to your email.",
    });
    setCountdown(30);
    setCanResend(false);
  };

  const onSubmit = async (values: MfaFormValues) => {
    setIsLoading(true);
    setFormError(null);

    try {
      const result = await AuthService.verifyMfa(values.code);

      if (result.success && pendingUser) {
        const { login } = useAuthStore.getState();
        const fakeToken = `fake-jwt-${pendingUser.id}-${Date.now()}`;
        login(pendingUser, fakeToken);
        clearPendingUser();
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
        return;
      }

      setFormError("Verification failed. Please try again.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Verification failed. Please try again.";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pendingUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md"
    >
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verify your identity
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-medium text-foreground">
            {pendingUser.email}
          </span>
          .
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mfa-code-0" className="sr-only">
            Verification code
          </Label>
          <Controller
            name="code"
            control={control}
            render={() => (
              <div className="flex justify-center gap-2 sm:gap-3">
                {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    id={`mfa-code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[index] ?? ""}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    className="h-12 w-12 text-center text-xl font-semibold sm:h-14 sm:w-14"
                    aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                  />
                ))}
              </div>
            )}
          />
          {errors.code && (
            <p className="text-center text-xs text-destructive">
              {errors.code.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || code.length !== CODE_LENGTH}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <div className="text-muted-foreground">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary hover:underline"
            >
              Resend code
            </button>
          ) : (
            <span>Resend code in {formatCountdown(countdown)}</span>
          )}
        </div>

        <Link
          to="/login"
          onClick={() => clearPendingUser()}
          className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      </div>
    </motion.div>
  );
}
