# Testing plan

Status as of 2026-09-30. This app had zero test infrastructure before this plan.
Remove this file (and its `CLAUDE.md` pointer) once every section below is closed out.

## Tooling (done)

- Vitest + jsdom, config in `vitest.config.ts` (kept separate from `vite.config.ts` so
  the `powerApps()` build plugin never runs during tests).
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`.
- Tests live under `src/__tests__/`, mirroring `src/`'s structure with flattened leaf
  names (`BaseButton.test.tsx`, not `index.test.tsx`).
- `src/__tests__` is excluded from the production build's type-check
  (`tsconfig.app.json`) and covered instead by `tsconfig.vitest.json`.
- Coverage reporting via `@vitest/coverage-v8` (`npm run test:coverage`) — no threshold
  gate yet. Revisit once there's a real baseline across more of the codebase.
- Explicit imports from `"vitest"` in every test file (no `globals: true`).
- Assertions are behavior/attribute-based — no snapshot tests, no `jest-axe`/a11y
  scanning (scope for a possible future pass, not part of this plan).
- **Always run `npm run test` before committing any change to this repo.**

## First slice (done)

- `src/types.ts`
- `src/helpers/scrollToTop.ts`
- `src/components/base/BaseButton`
- `src/components/base/BaseInput`

## Remaining pure-logic + presentational components (not started)

- `src/components/shared/charts/colors.ts`
- `src/pages/CatalogPage/components/OrderModal/schema.ts`
- `src/pages/CatalogPage/components/CatalogItemModal/schema.ts`
- `src/components/base/BaseTextarea`
- `src/components/shared/Modal`
- `src/components/shared/Pagination`
- `src/components/shared/Spinner`
- `src/components/shared/StatusBadge`
- `src/components/shared/Toast`
- `src/components/shared/charts/BarChart`
- `src/components/shared/charts/DonutChart`
- `src/components/shared/charts/LineChart`
- `src/components/shared/charts/TopItemsList`
- `src/pages/CatalogPage/components/CatalogItemCard`

Use the `create-power-app-react-tests` skill to write each of these.

## Deferred: hooks/pages tied to Dataverse (blocked)

Blocked on deciding a mocking convention for the generated `src/generated/services/*`
classes before any of this can start:

- `src/hooks/useCurrentUser.ts` — needs `getContext()` from `@microsoft/power-apps/app`
  mocked (not a simulated iframe/player — see `run-raftestpowerapp` skill for real
  end-to-end verification instead).
- `src/hooks/useSecurityContext.ts` — needs `SystemusersService`/`RolesService` mocked.
- `src/pages/CatalogPage/components/OrderModal` — calls
  `Cr9b0_internalordersService.create()` directly in its submit handler.
- `src/pages/CatalogPage/components/CatalogItemModal` — same shape, different service.
- `src/pages/*Page/index.tsx` (CatalogPage, MyOrdersPage, AllOrdersPage, ReportsPage) —
  all read from generated services.
- `src/App.tsx` / `RootRedirect` — iframe/`sessionStorage` route-persistence logic.

## Coverage gate (deferred)

Reporting only for now (`npm run test:coverage`, no failure threshold). Set a real
threshold once the remaining pure-logic/component tier above is covered, so the number
reflects a genuine baseline rather than an arbitrary starting point.
