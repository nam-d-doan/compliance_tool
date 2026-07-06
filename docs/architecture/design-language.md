# Design Language — from FDM demos (reference for compliance tool)

Extracted from `docs/FDM_Admin_Configuration_Demo_Flow_v1.6.html` and `docs/FDM_User_Alert_Investigation_Demo_Flow_v1.7.html`. These are the user's previous demo aesthetics — match this feel for the compliance tool.

## Color system (semantic tokens)

```
--bg:#f4f7fb        (app background — soft blue-grey)
--surface:#fff       (cards)
--surface2:#f8fafc   (insets, list items, secondary surfaces)
--line:#dbe4ef       (borders, dividers)
--text:#172033       (primary text — near-black navy)
--muted:#64748b      (secondary text, labels)
--navy:#0b2748       (headings, strong text, sidebar gradient base)

--blue:#2f6df6       (primary action, active state, links)
--blueBg:#eef4ff     (blue tint surface — active rows, callouts, badges)
--green:#218b57      (success, approved, complete)
--greenBg:#eaf8ef
--orange:#e79000     (warning, high priority, attention)
--orangeBg:#fff6df
--purple:#7852c7     (AI, model, optimisation, secondary accent)
--purpleBg:#f4efff
--teal:#0b8c8e       (system, enrichment, tertiary)
--tealBg:#e9f8f8
--red:#d64252        (critical, error, overdue)
--redBg:#fff0f2
--grey:#64748b       (neutral, pending)
--greyBg:#f1f5f9
--shadow:0 10px 28px rgba(15,23,42,.08)
```

**Mapping to our Tailwind v4 setup:** we already use shadcn semantic tokens (`bg-card`, `text-muted-foreground`, `border`). The FDM palette maps cleanly:

- `--bg` → `bg-background` / `bg-muted/30`
- `--surface` → `bg-card`
- `--surface2` → `bg-muted/40`
- `--line` → `border-border`
- `--text` → `text-foreground`
- `--muted` → `text-muted-foreground`
- `--navy` → headings use `text-foreground` (we don't need a separate navy; our foreground is already dark)
- Status colors → our `status.ts` already encodes these families (slate/blue/amber/red/emerald/violet/teal). Keep them.

## Layout patterns

### App shell

- **Sidebar:** fixed left, dark navy gradient `linear-gradient(180deg,#092746,#061b33)`, ~230-248px wide. Brand block at top (logo mark + name + subtitle). Nav items: icon + label, active item has `linear-gradient(90deg,rgba(blue,.3),rgba(green,.12))` bg + inset left blue border. Footer note at bottom ("Offline concept demo / Synthetic records only").
- **Topbar:** sticky, ~68px, `rgba(white,.94)` + `backdrop-filter:blur(14px)`, bottom border. Left: page title. Right: env badge, user chip (avatar + name + role), logout.
- **Content:** `padding:24px 26px 50px`, `max-width:1640px`, centered.

### Hero / page header

- Gradient banner `linear-gradient(135deg,#0c3767,#185b95 58%,#147769)` (navy→blue→teal), `border-radius:20px`, white text, `padding:26px 28px`, soft shadow.
- Contains: H2 title (30px), description (light blue `#dcecff`), optional flow-step strip or action buttons.
- **Use this for dashboard headers and major module landing pages.** Our `DashboardLayout` already does a greeting; consider upgrading key pages to this hero treatment.

### Section heads

- Flex row: left = H3 + muted description, right = action buttons. `margin:24px 0 12px`.

### Cards

- `bg-card`, `border`, `border-radius:14px`, `padding:16px`, soft shadow `0 4px 14px rgba(15,23,42,.05)`.
- Hover lift: `transition:.15s; hover:translateY(-2px) + bigger shadow`.
- **KPI cards:** icon in tinted circle (42px, radius 12px, colored bg), big number (26px, font-weight 900, navy), small muted label.

### Badges

- Pill: `border-radius:999px`, `padding:4px 8px`, `font-size:11px`, `font-weight:800`. Colored bg + colored text (blue/green/orange/purple/red/teal/grey). Our `StatusBadge`/`PriorityBadge` already do this — keep them.

### Callouts

- Left border 4px + tinted bg, `border-radius:0 10px 10px 0`, `padding:12px 14px`. Variants: blue (info), orange (warning), green (success). Use for AI insights, demo-objective notes, contextual tips.

### Tables

- Wrapped in `border-radius:12px` container with border. Sticky header `bg:#eef3f9`. Rows `padding:10px`, `font-size:12px`, hover `bg:#f7faff`. Selected row `bg:blueBg` with inset left blue border.

### Tabs

- Row with bottom border. Tab: `padding:10px 12px`, `font-weight:800`, muted color, active = blue text + 3px blue bottom border. Horizontal scroll on overflow.

### Forms

- 2-col grid (`repeat(2,1fr)`, gap 12px), `.wide` spans full. Field: label (12px, weight 800, navy) + control. Control: `border-radius:10px`, `padding:10px 11px`, focus = blue border + 3px blue ring.

### Split / master-detail

- Left list (310px) + right detail. List items: `border-radius:10px`, hover/active = blue border + blueBg.

### Steppers / journeys

- Horizontal strip of step cards with `→` arrows between. Each step: number circle + title + status. Done = green, current = blue, pending = grey.

### Module stack (investigation workbench)

- Vertical stack of `module-card`s (border, radius 13, surface2 bg). Each module: head (title + actions) + body (fact grids, tables). Reviewed modules get green border tint.

### Fact grids

- `repeat(3,1fr)` of small fact boxes (border, radius 9, surface bg). Label small muted + value bold navy. Alert facts get red border + redBg.

### Timeline / activity

- Vertical list. Each event: time column + marker dot + content. Color-coded left inset border by type (blue=key, orange=finding, purple=action, red=exception, teal=system).

## AI / model surfaces (the FDM "explainable" pattern)

### Model hero

- Dark gradient card `linear-gradient(135deg,#102f57,#1c5894)`, white text. Big score number (36px, weight 900). Meta grid of 2-col boxes with `rgba(white,.1)` bg + `rgba(white,.16)` border.

### Reason list (explainability)

- Each reason: rank circle (orange bg) + title + value + contribution bar (gradient orange→red) + meta chips (code-styled, `bg:#edf1f6`). Collapsible `<details>` for deeper explanation.
- **This is the pattern our `AIExplanation` component should evoke** — ranked reasons, contribution bars, collapsible detail, references as chips.

### Decision trace

- Horizontal strip of trace-node cards with `→` arrows. Each node: title + status. Executed = green, failed = red, selected = blue glow.

## Responsive strategy

- Breakpoints: 1500, 1350, 1250, 1100, 900, 760, 650, 420.
- Sidebar collapses to 76-80px (icons only) at 1100, hidden at 650.
- Multi-column grids collapse: 5→2 at 1100, →1 at 650. 4→2 at 1100, →1 at 700. 3→1 at 900.
- Split layouts collapse to single column at 1100-1200.
- **Container queries** used in v1.7 for the case workbench (collapses right rail based on workspace width, not viewport) — consider for our detail pages with sidebars.

## Motion

- Subtle: hover lifts (`translateY(-1px/-2px)`), pulse animation for running nodes (`flowPulse`), toast slide-up. Nothing flashy. Our `motion/react` entrance fades match this restraint.

## What to apply to the compliance tool

1. **Hero banners** on dashboard + major module landing pages (navy→blue→teal gradient, white text).
2. **Callouts** for AI insights and contextual notes (left-border tinted).
3. **KPI cards** with tinted icon circles (we have KPICard — verify it matches this pattern).
4. **Stepper/journey strips** on multi-step flows (compliance submission, CAP creation, license renewal).
5. **Module stack** pattern on detail pages (compliance detail, CAP detail) — vertical stack of bordered module cards.
6. **Fact grids** for metadata displays (3-col small boxes).
7. **AI reason list** pattern — ranked reasons with contribution bars + collapsible detail. Enhance `AIExplanation` to evoke this.
8. **Decision trace** strip for approval workflows and AI decision paths.
9. **Container queries** for detail pages with right sidebars (collapse based on content width, not viewport).
10. **Restraint on motion** — hover lifts and entrance fades only.
