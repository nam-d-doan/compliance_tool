import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Breadcrumb } from "./Breadcrumb";
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
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <TopNav />
          <div className="flex flex-1 flex-col min-h-0 min-w-0">
            <div className="border-b bg-background px-6 py-3 flex-shrink-0">
              <Breadcrumb />
            </div>
            <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6 pb-24">
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AICopilot />
    </>
  );
}
