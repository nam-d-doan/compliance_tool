import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AuroraBackground } from "./AuroraBackground";
import { TopNav } from "./TopNav";
import { AICopilot } from "@/components/ai";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

export function MainLayout() {
  return (
    <>
      <AuroraBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1640px] flex-col">
        <TopNav />
        <main className="min-w-0 flex-1 px-4 pt-4 pb-24 sm:px-6">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <AICopilot />
    </>
  );
}
