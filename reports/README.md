# Performance regression evidence

All measurements use the generated production site at `http://127.0.0.1:3000`, not Nuxt development mode.

- `lighthouse/before/*.json`: the six baseline Lighthouse reports.
- `lighthouse/after/*.json`: the matching six reports after the optimization.
- `lighthouse/summary.json`: compact before/after metrics plus the rooms-mobile LCP, payload, and ten slowest requests.
- `regression/browser-final.json`: client-side navigation timings, chunk counts, login/session refresh checks, dropdown checks, plan/3D checks, and captured browser errors.
- `regression/resource-hints-final.json`: generated-page counts and a safety fixture proving that only `rel=prefetch` is removed.

Reproduce the evidence after `npm run build` and `npm run preview`:

```text
node scripts/audit-lighthouse.mjs http://127.0.0.1:3000 all reports/lighthouse/after
node scripts/audit-browser-performance.mjs http://127.0.0.1:3000 reports/regression/browser-final.json
node scripts/audit-resource-hints.mjs http://127.0.0.1:3000 reports/regression/resource-hints-final.json
node scripts/summarize-lighthouse.mjs reports/lighthouse reports/lighthouse/summary.json
```

`clientReadyAfterHtml` is a client-ready window, not framework-only hydration time. Its start is Navigation Timing `responseEnd`; its end is the first zero-delay polling task that observes Vue's mounted app at `#__nuxt.__vue_app__`. It therefore includes module download, parse, execution, and Vue hydration.
