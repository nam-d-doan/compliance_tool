import { MFAForm } from "@/components/auth/MFAForm";
import { Card, CardContent } from "@/components/ui/card";

export default function MFAPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8">
          <MFAForm />
        </CardContent>
      </Card>
    </div>
  );
}
