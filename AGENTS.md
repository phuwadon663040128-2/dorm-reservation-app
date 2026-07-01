# AGENTS.md

## Project Context

This is the Vue frontend/mock-up app for the KKU Affiliated Dorm Application & Reservation System.

The project documentation has been moved into this app directory. Before making UX/UI or frontend changes, read:
- `KKU Affiliated Dorm Application & Reservation Syst 38e9192afd1181f6924fc4fabecb4462.html`
- `KKU Affiliated Dorm Application & Reservation Syst/07 — Live Product Pivot & Stakeholder Notes 38f9192afd1181b8af92d51f148bdd29.html`
- `KKU Affiliated Dorm Application & Reservation Syst/08 — Payment Rules, Slip Verification & Reservatio 38f9192afd11811dbd68fd9d58063128.html`
- `KKU Affiliated Dorm Application & Reservation Syst/03 — Updated UX Application, Slip Upload & Manager 38e9192afd1181efb0cff4548f584f30.html`
- `KKU Affiliated Dorm Application & Reservation Syst/KKU Affiliated Dorm — Feature Backlog & Build Task 48217d02ce0b47f8bd36f8ce1d894e07.csv`
- `KKU Affiliated Dorm Application & Reservation Syst/KKU Affiliated Dorm — Open Questions & Assumptions 48d0a931e3234373842d17db79b5518b.csv`
- `KKU Affiliated Dorm Application & Reservation Syst/KKU Affiliated Dorm — Payment Rule Matrix 85c1f401c7d44929b70fa91d84f21022.csv`

Stack:
- Vite + Vue 3 + TypeScript
- Tailwind CSS v4 via `@tailwindcss/vite`
- shadcn-vue v2 components in `src/components/ui`
- Reka UI primitives
- lucide icons via `@lucide/vue`
- Alias `@/*` maps to `src/*`

Do not use React, Next.js, JSX, TSX, or React shadcn/ui imports.

## Commands

- `npm run dev`
- `npm run build`
- `npx shadcn-vue@latest add <component>`

Use npm in this project. `pnpm` and `yarn` are not assumed to be installed.

## shadcn-vue Usage

- Import components from `@/components/ui/<component>`.
- All available shadcn-vue components are installed under `src/components/ui`.
- Prefer shadcn-vue primitives before custom components.
- Use `cn` from `@/lib/utils` for class composition.
- Use lucide icons from `@lucide/vue` in buttons, nav, tables, alerts, and status UI.
- Keep `src/style.css` as the Tailwind v4 theme source with `@theme inline` semantic tokens.
- Keep `vite.config.ts` using `tailwindcss()` in the Vite plugin list.
- Do not restore Tailwind v3 PostCSS config or `@tailwind base/components/utilities`.

Recommended component choices:
- Forms: `field`, `label`, `input`, `input-group`, `textarea`, `select`, `native-select`, `radio-group`, `checkbox`, `switch`, `calendar`, `combobox`, `button`
- Admin data: `table`, `badge`, `tabs`, `dropdown-menu`, `pagination`, `dialog`, `sheet`, `alert-dialog`
- Layout: `sidebar`, `card`, `separator`, `scroll-area`, `resizable`, `breadcrumb`, `navigation-menu`
- Feedback: `alert`, `sonner`, `progress`, `skeleton`, `empty`, `tooltip`, `hover-card`
- Mock-up richness: `chart`, `stepper`, `carousel`, `accordion`, `collapsible`

## Product Rules

This app is not mainly a central-dorm fair allocation engine. It is an affiliated dorm online application and reservation operations system.

Core workflow:
0. User enters through the KKU SSO mock login and receives either applicant or admin access from that session.
1. Dorm manager creates an application campaign.
2. Applicant views dorms, room types, quota, rules, and payment condition.
3. Applicant submits online form and selects applicant type.
4. System shows required payment before final submit.
5. UniPay is the preferred payment path when university access is approved.
6. Manual slip upload remains a fallback or exception flow.
7. Staff verifies payment evidence or synced payment status.
8. Manager approves/rejects reservation and quota updates.
9. System supports export/report and audit logs.

Important uncertainty:
- Do not claim "ได้ห้องแน่นอน" until the official confirmation rule is known.
- Treat exact room selection, roommate/group booking, maintenance, automatic slip verification, and existing invoice integration as future scope unless requested.
- The frontend may include a KKU SSO mock for UX testing only. It is not a real authentication integration.

## UX/UI Rules

- Build real application screens, not marketing landing pages.
- Student-facing screens should use Thai copy by default.
- Admin screens should be dense, scannable, and workflow-focused.
- Role switching must happen through the KKU SSO mock login only. Do not add topbar role-toggle buttons.
- Logging out should reset mock data so each demo/test starts from a clean state.
- Show the active user's avatar/profile affordance on the top bar. For applicants, show the student ID next to the avatar; for staff, show a staff identifier.
- Prefer room type/quota selection over exact room selection for core mock-ups.
- Show reservation and payment status clearly: submitted, waiting for payment, slip uploaded, verifying, needs re-upload, reserved, rejected, expired.
- Use semantic Tailwind tokens such as `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
- Current mock-up palette should stay strictly white, gray, and black. Do not add maroon, brand-color accents, or any extra accent color unless the user explicitly re-approves it.
- Never add colored strips, colored top borders, colored divider lines, or decorative color rules to cards, buttons, page sections, alerts, tabs, nav bars, or any other UI element. Use neutral borders, spacing, typography, and shadcn-vue states instead.
- Keep layouts responsive for mobile and desktop.

## Verification

Before finishing:
- Run `npm run build`.
- Confirm imports use `@/components/ui/...`.
- Confirm no TypeScript errors.
- Do not require a backend unless explicitly requested.
