# Compliance Tool — Work Contract

## Purpose

Banking/financial-services compliance management SPA. Tracks regulations, compliance obligations, evidence, corrective action plans (CAPs), and licenses. Currently a frontend-only prototype with an MSW mock API; no real backend exists yet.

## Ownership

Single-owner project. No team/subtree ownership boundaries enforced yet.

## Local Contracts

- **Package manager:** pnpm ONLY. Do not use npm or yarn.
- **Node:** Requires a runtime compatible with the pinned deps (React 19.2, Vite 8, TypeScript 6).
- **Path alias:** `@/` → `./src/` (configured in `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`).
- **React 19 overrides:** `react-is` pinned to `^19.0.0` via `package.json` `overrides`.
- **Pre-commit:** `.pre-commit-config.yaml` in root. Hooks: conventional-pre-commit (commit-msg), betterleaks (secret scan), standard hygiene (trailing-whitespace, end-of-file-fixer, check-yaml/json/toml, detect-private-key, check-added-large-files), prettier, oxlint.
- **Commit messages:** Conventional format — allowed types: `feat`, `fix`, `improve`, `style`, `env`, `docs`, `refactor`, `ci`, `test`, `chore`, `git`, `wip`.
- **Exclusions from formatting:** `docs/specs/`, `dist/`, `node_modules/`, `public/mockServiceWorker.js`, `src/components/ui/` (shadcn-generated), `pnpm-lock.yaml`, `tsconfig.*.json` (JSONC).

## Work Guidance

- **Dev server:** `pnpm dev` — starts Vite with MSW mock worker (dev only; prod hits real backend).
- **Build:** `pnpm build` — runs `tsc -b && vite build`.
- **Lint:** `pnpm lint` — runs oxlint.
- **Before committing:** run `prek run --all-files` and fix ALL failures. No exceptions.
- **Demo credentials:** `demo@demo.com` / `demo1234` (see `src/constants/demo-users.ts` for all demo accounts by role).
- **No backend:** All API calls go to `/api/*` endpoints. In dev, MSW intercepts these. In prod, set `VITE_API_URL` to the real backend origin.

## Verification

1. `prek run --all-files` — must exit 0.
2. `pnpm build` — must complete without TypeScript errors.
3. `pnpm lint` — must pass.
