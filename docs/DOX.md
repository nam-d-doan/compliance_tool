# docs/ — Documentation Subtree Contract

## Purpose

Reference documentation: feature specs, architecture decisions, and design language. Prose-only — not executable code.

## Ownership

Project-level. Specs are authored during planning; architecture docs are maintained as the codebase evolves.

## Local Contracts

- **`specs/`** — phased feature specs (P1–P5). Excluded from formatters via `.pre-commit-config.yaml` (`exclude: ^docs/specs/`). These are prose documents driving feature development.
- **`architecture/`** — reference docs:
  - `folder-structure.md` — intended folder layout and tech stack setup steps. May drift from actual structure; treat as reference, not source of truth.
  - `design-language.md` — visual design patterns extracted from FDM demos. Binding for UI work.
- **HTML demo files** (`FDM_*.html`) — reference demos from a prior project. Not part of the build; kept for design reference only.
- **PDF** (`Business_user_guide2025 3.pdf`) — business user guide. Gitignored (`*.pdf` in `.gitignore`); not tracked.

## Work Guidance

- Specs drive feature development — read the relevant spec before implementing a phase.
- Architecture docs are reference material. If the actual code structure diverges, update the doc or mark it stale.
- Design language doc is binding for UI/UX work — match the documented patterns (hero banners, callouts, KPI cards, etc.).
- Do not run formatters on `specs/` (excluded by design — prose may use intentional formatting).

## Verification

- No automated verification. Review manually when docs change.
