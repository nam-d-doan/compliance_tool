import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent } from "@/components/ui/card";
import { AuroraBackground } from "@/components/layout/AuroraBackground";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <AuroraBackground />
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
