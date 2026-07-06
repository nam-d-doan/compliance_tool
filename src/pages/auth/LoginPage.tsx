import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Lock, Cpu } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.08),transparent_40%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
            <Shield className="size-6" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            ComplianceAI
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            AI-powered compliance management for modern enterprises
          </h2>
          <p className="mt-4 text-base text-primary-foreground/80">
            Streamline obligations, corrective actions, and regulatory reporting
            in one intelligent platform.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="flex items-start gap-4 rounded-xl bg-primary-foreground/10 p-4">
              <Cpu className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">AI Copilot</p>
                <p className="text-sm text-primary-foreground/80">
                  Get recommendations, summaries, and risk insights on demand.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-primary-foreground/10 p-4">
              <Lock className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-medium">Enterprise-grade security</p>
                <p className="text-sm text-primary-foreground/80">
                  Role-based access, audit trails, and multi-factor
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} ComplianceAI Demo. All rights
          reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="mb-6 flex items-center gap-2 lg:hidden">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="size-5" />
          </div>
          <span className="text-lg font-semibold">ComplianceAI</span>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
