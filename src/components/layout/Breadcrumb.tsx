import { Link, useMatches } from "react-router-dom";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface RouteMatch {
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: unknown;
  handle?: {
    crumb?: string | ((data: unknown) => string);
  };
}

export function Breadcrumb() {
  const matches = useMatches() as RouteMatch[];

  const crumbs = matches
    .filter(
      (match) =>
        match.handle && typeof match.handle === "object" && match.handle.crumb,
    )
    .map((match) => {
      const crumb = match.handle?.crumb;
      return {
        label: typeof crumb === "function" ? crumb(match.data) : (crumb ?? ""),
        path: match.pathname,
      };
    });

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            render={
              <Link to="/dashboard" className="flex items-center gap-1" />
            }
          >
            <Home className="size-3.5" />
            <span className="sr-only">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <BreadcrumbItem key={`${crumb.path}-${index}`}>
              {isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link to={crumb.path} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
              {!isLast && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
