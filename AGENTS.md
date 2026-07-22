# AGENTS.md

## Project Context

This is the Vue frontend/mock-up app for the KKU Affiliated Dorm Application & Reservation System.

The current implementation is the visual source of truth. Before making UX/UI or frontend changes, read:
- `src/style.css`
- the affected layout and view files under `src/layouts` and `src/views`
- `docs/design-briefs/00-design-system.md`
- the relevant screen brief under `docs/design-briefs`

For product rules and unresolved policy, use the latest matching exports under `reference/notion/Private & Shared/KKU Affiliated Dorm Application & Reservation Syst`, especially:
- `07*Live Product Pivot*.html`
- `08*Payment Rules*.html`
- `*Feature Backlog*.csv`
- `*Open Questions & Assumptions*.csv`
- `*Payment Rule Matrix*.csv`

If a design brief disagrees with the rendered app, preserve the rendered app unless the user explicitly requests a redesign. If product policy conflicts, the latest pivot/payment notes win.

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

This app is an exact-room application, reservation, payment-document, contract, and operations system for the affiliated-dorm pilot (Wor Residence / eight dorm buildings plus Wor Inter). It is not a central-dorm fair-allocation engine.

Core workflow:
0. Applicant registers with a verified personal email; optional KKU SSO linking is a secondary path. Staff access is role- and section-scoped.
1. Staff configures campaigns, room inventory, availability, pricing, and applicant/payment rules.
2. Applicant views campaign details and availability, submits the four-step application form, and completes required profile data.
3. For shared rooms, roommate/group invitations have a 48-hour response window. A selected room uses a 15-minute confirmation hold.
4. A confirmed reservation group receives a 72-hour payment hold and explicit payment obligations.
5. Payment operations use SCB document exchange: export XLSX/SLIPS data, import returned PDF/result files, then reconcile exceptions.
6. Staff manages contracts, signed-document tracking, key handover, university handoff, reports, access control, and audit logs.

Important uncertainty:
- Do not claim "ได้ห้องแล้ว" or guaranteed occupancy until the official confirmation event is known.
- Direct SCB API integration, automated payment verification, production KKU SSO, maintenance, and integration with the existing invoice system remain future scope unless explicitly requested.
- Uploaded payment slips are not the normal flow. Manual payment evidence belongs to an exception/override flow with actor, reason, reference, timestamp, and audit history.
- The frontend is a mock-up. Authentication, holds, deadlines, payment matching, and file processing do not imply production integrations.

## UX/UI Rules

- Build real application screens, not marketing landing pages.
- Student-facing screens should use Thai copy by default.
- Admin screens should be dense, scannable, and workflow-focused.
- Role switching happens through the login/demo-session flow only. Do not add role-toggle controls to application or staff top bars.
- Logging out should reset mock data so each demo/test starts from a clean state.
- Show the active user's avatar/profile affordance on the top bar. For applicants, show the student ID next to the avatar; for staff, show a staff identifier.
- Preserve the current exact-room and roommate/group-booking model. Show hold ownership and countdowns wherever room availability can change.
- Show application, invitation, hold, payment, contract, and handover states with text or icons in addition to color.
- Use semantic Tailwind tokens such as `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
- Preserve the current warm cream/orange light theme and navy/orange dark theme from `src/style.css`: light background `#f4efe6`, light foreground `#211d18`, card `#ffffff`, primary `#ee6f1e`, muted/secondary `#ece4d4`, border `#e2d8c4`; dark background `#0a101d`, dark card `#101a2c`, primary `#f47a20`.
- KKU red (`#A73B24` light / `#d96a4a` dark) is a restrained secondary brand accent, not the primary action color. Staff sidebar stays dark navy in both modes (`#1f2634` light / `#0d1526` dark), with orange for active navigation.
- Use Geist with IBM Plex Sans Thai fallback at weights 400/500/600/700. Use `tabular-nums` for money, room numbers, counts, deadlines, and document/page references.
- Use the current radius system: base `12px`, small `8px`, medium `10px`, large `12px`, extra-large `16px`; badges and avatars may be fully rounded.
- Preserve the current layout metrics unless the user asks for a redesign: public header `64px`; staff top bar `56px`; expanded staff sidebar `256px` (collapsed `48px`); public content max width `1408px`; staff main padding `12px` mobile, `16px` small screens, and `24px` desktop.
- Never add arbitrary colored strips, top borders, divider lines, or decorative color rules. Use semantic tokens, neutral borders, spacing, typography, and existing shadcn-vue states.
- Keep layouts responsive for mobile and desktop.
- Maintain visible focus rings, WCAG AA contrast, `aria-label` on icon-only buttons, correct table headers, and confirmation dialogs with a required reason for destructive or one-time staff actions.

## Verification

Before finishing:
- Run `npm run build`.
- Confirm imports use `@/components/ui/...`.
- Confirm no TypeScript errors.
- Do not require a backend unless explicitly requested.
