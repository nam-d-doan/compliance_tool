import { MFAForm } from "@/components/auth/MFAForm";
import { Card, CardContent } from "@/components/ui/card";
import { AuroraBackground } from "@/components/layout/AuroraBackground";

export default function MFAPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <AuroraBackground />
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <MFAForm />
        </CardContent>
      </Card>
    </div>
  );
}
