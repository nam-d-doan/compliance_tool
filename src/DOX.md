# src/ — Frontend Source Contract

## Purpose

React 19 + TypeScript SPA source. Domain-driven module organization: each business domain (compliance, evidence, cap, ncc, license, regulation, reports, admin) has its own types, services, hooks, components, and pages. The EWS (Early Warning System) report lives under the reports domain and reads NCC data for trending analysis.

## Ownership

Frontend-owned. No per-domain ownership boundaries enforced yet.

## Local Contracts

### Data Flow

```
MSW Handlers (mocks/handlers/) → Services (services/) → React Query (hooks/) → UI (components/ + pages/)
```

- **Services** (`services/*.ts`): thin wrappers over `lib/api.ts` (fetch-based `apiGet/apiPost/apiPut/apiPatch/apiDelete/apiUpload`). Each service exports a singleton object (e.g., `ComplianceService`).
- **Hooks** (`hooks/queries/`, `hooks/mutations/`): TanStack Query wrappers. Query keys centralized in `hooks/query-keys.ts` using factory pattern.
- **Types** (`types/*.ts`): TypeScript interfaces per domain, re-exported from `types/index.ts`.

### State Management

- **Auth:** Zustand store (`stores/authStore.ts`) with `persist` middleware → `localStorage` key `auth-storage`. Holds user, token, role, isAuthenticated.
- **Server state:** TanStack Query (`App.tsx` configures `QueryClient` with `retry: false`, `staleTime: 5min`, `gcTime: 10min`).
- **UI state:** Local component state or Zustand for global UI (theme via `stores/themeStore.ts`, AI copilot via `stores/copilotStore.ts`).

### RBAC

- Role hierarchy (highest → lowest): `admin` > `executive` > `owner` > `approver` > `reviewer` (defined in `constants/rbac.ts`).
- Route permissions in `constants/routes.ts` (`ROUTE_PERMISSIONS` map).
- Nav tree built per-role via `buildNavTree(role)`.
- Route guards: `ProtectedRoute` (auth check), `AuthRouteGuard` (redirect if authenticated), `MFARouteGuard`.

### Routing

- `routes/index.tsx` — single `createBrowserRouter` with lazy-loaded pages.
- Public: `/login`, `/forgot-password`, `/mfa`.
- Protected (under `ProtectedRoute` + `MainLayout`): `/dashboard/*`, `/obligations/*`, `/evidence/*`, `/cap/*`, `/ncc/*`, `/license/*`, `/regulation/*`, `/reports/*`, `/admin/*`, `/profile`, `/settings`.

### API Client

- `lib/api.ts` — `ApiClient` class wrapping `fetch`. Reads auth token from `localStorage` (`auth-storage` key). Base URL from `VITE_API_URL` env var (empty = same-origin).
- Endpoint constants in `constants/api.ts` (all prefixed with `/api/`).

## Work Guidance

### Component Development Pattern (per new feature)

1. Define types in `types/[domain].ts`
2. Add mock data generators in `mocks/db.ts`
3. Write MSW handlers in `mocks/handlers/[domain]_handlers.ts`
4. Build service functions in `services/[domain]_service.ts`
5. Create query/mutation hooks in `hooks/queries/` and `hooks/mutations/`
6. Build UI components in `components/[domain]/`
7. Assemble pages in `pages/[domain]/`
8. Register routes in `routes/index.tsx`

### Conventions

- **shadcn/ui components** live in `components/ui/` — excluded from oxlint. Do not hand-edit; regenerate via `pnpm dlx shadcn@latest add <component>`.
- **Barrel exports:** each `components/[domain]/` has an `index.ts` re-exporting its members.
- **Lazy loading:** all page components use `React.lazy()` in `routes/index.tsx`.
- **Design language:** see `docs/architecture/design-language.md` for visual patterns (hero banners, callouts, KPI cards, fact grids, AI reason lists).

## Verification

- `pnpm build` — TypeScript compiles, Vite bundles.
- `pnpm lint` — oxlint passes (excludes `components/ui/`).
- Dev server (`pnpm dev`) — direct fetch override (`src/mocks/directApi.ts`) initializes; mock data renders without a service worker.
