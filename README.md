# KKU Affiliated Dorm Application & Reservation System

Interactive frontend mock-up built with Nuxt 4, Vue 3, TypeScript, Pinia, Tailwind CSS v4, and shadcn-vue.

## Project structure

- `src/` — Nuxt application source, layouts, views, stores, fixtures, and components
- `public/` — static files served by the application
- `docs/` — project documentation and design briefs
- `reference/` — source documents, design exports, plans, and media that are not bundled into the application
- `reports/` — committed Lighthouse and browser-regression baselines
- `scripts/` — local audit, preview, and asset-processing utilities

Generated folders such as `.nuxt/`, `.output/`, `dist/`, `.cache/`, and `tmp/` are intentionally ignored and can be removed safely.

## Commands

- `npm run dev` — start the Nuxt development server
- `npm run build` — type-check and generate the optimized static production build
- `npm run build:server` — create a Nitro server build when backend routes are introduced
- `npm run generate` — generate a static deployment
- `npm run preview` — preview the production build locally; runs `npm run build` automatically when `.output/public` is missing
