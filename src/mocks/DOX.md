# src/mocks/ — Mock API Contract

## Purpose

Dual-mode mock API layer. Development uses a lightweight `window.fetch` override (`directApi.ts`) so `/api/*` requests never touch a service worker. Production/demo builds can opt into the MSW service worker via `VITE_ENABLE_MSW=1`.

## Ownership

Frontend-owned. Changes here must stay in sync with `services/` and `constants/api.ts`.

## Local Contracts

### Dual-Mode Lifecycle

- `directApi.ts` — dev-mode fetch override. Imported dynamically by `src/main.tsx` when `import.meta.env.DEV` is true. Adds a 100–300 ms network delay before invoking the same handler functions used by MSW.
- `browser.ts` — `setupWorker(...handlers)` from `msw/browser`. Imported dynamically by `src/main.tsx` only when `import.meta.env.PROD && import.meta.env.VITE_ENABLE_MSW === '1'`.
- `main.tsx` also unregisters any stale `mockServiceWorker.js` registration in dev, so previous MSW workers stop controlling the page.
- `public/mockServiceWorker.js` — generated MSW service worker. Do not hand-edit. Regenerate via `pnpm dlx msw init public/ --save`.

### Handler Dual-Export Pattern

Each handler file (`handlers/[domain]_handlers.ts`) exports:

1. **Individual async functions** (e.g., `handleLogin`) — take `{ request, params }` (MSW resolver context). Used by both MSW and `directApi.ts`.
2. **MSW handler array** (e.g., `authHandlers = [http.post('/api/auth/login', handleLogin), ...]`) — registered in `handlers/index.ts` and spread into `browser.ts` worker.

Both exports use the same functions. The individual functions are MSW-compatible (they destructure `{ request }` from MSW's resolver context). When called from `directApi.ts`, `params` is built from the request pathname.

### Mock DB

- `db.ts` — singleton in-memory database (`getDb()`). Seeded with `faker.seed(42)` for deterministic data. Resets on page reload.
- Collections: users, regulations, regulationDependencies, compliance, obligations, caps, nccs, assignments, notifications, auditLogs, roles, organizations, aiConfig, organizationSettings, plus the CMS collections legalUpdates, incomingLegalQueue, internalRegulations, revisionTasks, icisFindings, incomingIcisQueue, riskMatrices, escalationRules, reportTemplates, scheduledReports.
- Helpers: `findById`, `paginate`, `filterByText`.
- Timeline and comments are generated on-demand via `generateTimelineFor` / `generateCommentsFor`.

### CMS modules (Nam A Bank RFQ Phụ lục 1)

- `cms-seed.ts` — curated, deterministic Vietnamese sample data for the CMS: internal regulations (QĐNB), legal updates (+ the `incomingLegalQueue` pulled by "Sync now"), revision tasks, ICIS findings (+ `incomingIcisQueue`), compliance issues (replaces the old faker NCCs), risk matrices, escalation rules, report templates and schedule. Dates are relative to the real current day.
- `cms-engine.ts` — `recordAudit`, `pushNotification`, `runScheduler` (reminders, overdue/late-issuance alerts, overdue escalation), `applyRiskEscalation`, and `auditMutation` (generic audit for the original modules).
- `handlers/cms_handlers.ts` declares **one route table, `cmsRoutes`**, used for both MSW (`cmsHandlers`) and `directApi.ts` (spread into its `routes`). New CMS endpoints only need an entry in `cmsRoutes`.
- Audit trail: CMS handlers call `recordAudit` themselves; every other mutating request is audited by `auditMutation`, called from `directApi.ts` (dev) and from the MSW `response:mocked` event in `browser.ts` (prod demo).
- Demo clock: `stores/demoClockStore.ts` shifts "today" (`demoNow()`); `POST /api/cms/scheduler/run` evaluates reminders and escalations at the new date.

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

- Do not start the MSW service worker in regular dev mode. Use `directApi.ts` instead.
- Do not start the worker in production unless `VITE_ENABLE_MSW=1` is set. The guard in `src/main.tsx` handles this.
- Do not hand-edit `public/mockServiceWorker.js`. Regenerate via `pnpm dlx msw init public/ --save`.

## Verification

- Dev server (`pnpm dev`) — console shows `[DirectMock] Mock API initialized`. No `mockServiceWorker.js` entry in the Network tab or Application > Service Workers.
- Production demo (`VITE_ENABLE_MSW=1 pnpm preview`) — console shows `[MSW] Mock worker started` and `/api/*` requests are intercepted by `mockServiceWorker.js`.
- Mock data renders in UI (login with `admin@demo.com` / `demo1234`).
