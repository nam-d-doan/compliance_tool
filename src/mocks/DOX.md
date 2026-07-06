# src/mocks/ — MSW Mock API Contract

## Purpose

MSW v2 mock API layer for development. Intercepts `/api/*` requests in the browser via a service worker. Bypassed in production builds.

## Ownership

Frontend-owned. Changes here must stay in sync with `services/` and `constants/api.ts`.

## Local Contracts

### MSW Worker Lifecycle

- `browser.ts` — `setupWorker(...handlers)` from `msw/browser`. Imported dynamically by `src/main.tsx` in dev only (`import.meta.env.PROD` guard).
- `main.tsx` calls `worker.start({ onUnhandledRequest: 'bypass' })` before rendering. Unhandled requests (assets, HMR) pass through silently.
- `public/mockServiceWorker.js` — generated MSW service worker. Do not hand-edit. Regenerate via `pnpm dlx msw init public/ --save`.

### Handler Dual-Export Pattern

Each handler file (`handlers/[domain]_handlers.ts`) exports:

1. **Individual async functions** (e.g., `handleLogin`) — take `{ request, params }` (MSW resolver context). Used internally.
2. **MSW handler array** (e.g., `authHandlers = [http.post('/api/auth/login', handleLogin), ...]`) — registered in `handlers/index.ts` and spread into `browser.ts` worker.

Both exports use the same functions. The individual functions are MSW-compatible (they destructure `{ request }` from MSW's resolver context).

### Mock DB

- `db.ts` — singleton in-memory database (`getDb()`). Seeded with `faker.seed(42)` for deterministic data. Resets on page reload.
- Collections: users, regulations, compliance, submissions, evidence, caps, licenses, notifications, auditLogs, roles, organizations, templates, aiConfig, organizationSettings.
- Helpers: `findById`, `paginate`, `filterByText`.
- Timeline and comments are generated on-demand via `generateTimelineFor` / `generateCommentsFor`.

### Utils

- `handlers/utils.ts` — `getDelay` (200-500ms random), `jsonResponse`, `badRequest`, `notFound`, `parseQuery`, `parseNumber`, `normalizeArrayParam`. All use MSW's `HttpResponse` and `delay`.

## Work Guidance

### To add a new mock endpoint

1. Add a handler function in the relevant `handlers/[domain]_handlers.ts`.
2. Add an entry to that file's MSW handler array (e.g., `http.get('/api/new-endpoint', handleNewEndpoint)`).
3. If new domain, create the handler file and register it in `handlers/index.ts`.
4. Add the endpoint constant to `constants/api.ts`.
5. Add mock data to `db.ts` if needed.

### Do NOT

- Do not create alternative mock mechanisms (e.g., fetch override). The previous `directApi.ts` approach was removed — use MSW exclusively.
- Do not start the worker in production. The `import.meta.env.PROD` guard in `main.tsx` handles this.

## Verification

- Dev server (`pnpm dev`) — console shows `[MSW] Mock worker started`.
- Network tab — `/api/*` requests intercepted by `mockServiceWorker.js`.
- Mock data renders in UI (login with `admin@demo.com` / `demo1234`).
