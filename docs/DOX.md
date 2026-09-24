# docs/ — Documentation Subtree Contract

## Purpose

Reference documentation: feature specs, architecture decisions, and design language. Prose-only — not executable code.

## Ownership

Project-level. Specs are authored during planning; architecture docs are maintained as the codebase evolves.

## Local Contracts

- **`USER_FLOW.md`** — ground-truth description of the actual user flow (roles, lifecycle, key files), derived from the code as it exists today. This is the trustworthy source for current behavior — prefer it over `specs/` when they conflict.
- **`specs/`** — phased feature specs (P1–P5), each now marked historical/aspirational — they describe a larger, partially different product than what's built. Excluded from formatters via `.pre-commit-config.yaml` (`exclude: ^docs/specs/`). Read for original intent/context, not as ground truth.
- **`architecture/`** — reference docs:
  - `folder-structure.md` — intended folder layout and tech stack setup steps. May drift from actual structure; treat as reference, not source of truth.
  - `design-language.md` — visual design patterns extracted from FDM demos. Binding for UI work.
- **`diagrams/`** — generated architecture/module diagrams (HTML + SVG + PNG). Self-contained, no build step beyond `python3 build.py`. `gen.py`/`m1.py`/`m2.py` are the regenerable source; `html/*.html` are interactive (dark mode + pan/zoom + click nodes), `sources/*.svg` are standalone slide-ready (concrete colors), `renders/*.png` are raster previews (rendered via `resvg`). Edit diagram content in `m1.py`/`m2.py`, not in the emitted artifacts.
- **`deployment.md`** — deployment guide covering:
  - Vercel as the primary production deployment method
  - Build settings, environment variables, and custom domain configuration
  - CI/CD workflow and production optimizations
- **HTML demo files** (`FDM_*.html`) — reference demos from a prior project. Not part of the build; kept for design reference only.
- **PDF** (`Business_user_guide2025 3.pdf`) — business user guide. Gitignored (`*.pdf` in `.gitignore`); not tracked.

## Work Guidance

- Specs drive feature development — read the relevant spec before implementing a phase.
- Architecture docs are reference material. If the actual code structure diverges, update the doc or mark it stale.
- Design language doc is binding for UI/UX work — match the documented patterns (hero banners, callouts, KPI cards, etc.).
- `deployment.md` should be kept up-to-date with the actual deployment process. Update Vercel steps if build settings change.
- Do not run formatters on `specs/` (excluded by design — prose may use intentional formatting).

## Verification

- No automated verification. Review manually when docs change.
