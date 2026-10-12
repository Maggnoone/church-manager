# Smooth Route Navigation — ODD Task Tracker

## User problem and intent

Navigation currently repeats visual route transitions, attendance report summaries churn their query key with the full attendance array and fetch redundant metadata, and dashboard trend data can remain a snapshot after summaries resolve. The user authorized the previously explained fixes, including a safe, bounded authenticated warmup strategy. This tracker is the implementation plan and evidence ledger for that work.

## Skills to load before work

- `/home/mauricio/.agents/skills/work-unit-commits/SKILL.md` — required before task-specific implementation work.
- `/home/mauricio/Documentos/Repositories/church-manager/.agents/skills/vercel-react-best-practices/SKILL.md` — required for React data-fetching and lifecycle work.

## Scope

- Reduce repeated visual route transitions without retaining prior routes.
- Derive attendance summaries from stable canonical query data and avoid redundant/sequential reads while preserving existing group and duplicate semantics.
- Make dashboard trend values update as summaries resolve without hiding or replacing cached stats.
- Add bounded, non-blocking prefetch for common non-financial authenticated catalogs only after session and role readiness; use the same query keys/options as consumers and isolate cache on cancellation, logout, or account change.

### Non-goals and constraints

- No full-table eager fetches.
- No financial-data warmup without strict permission; this plan does not add financial prefetch.
- Do not globally inflate query freshness to conceal redundant fetching.
- Do not change the unrelated baseline TypeScript issue.
- Do not retain route components/content as a navigation optimization.
- Keep existing unrelated untracked `.opencode/` and `AGENTS.md` untouched.
- Implementation is explicitly authorized by the user. The user has explicitly directed that all further work remain on `main`, uncommitted, with no additional commits and no alternate branches; this overrides the commit/branch workflow described in the skill and older task plan.
- Push and PR remain unauthorized; do not perform remote operations.

## Resolved verification configuration

- Strict TDD remains active, per the user's prior selection.
- Exact test runner: `npm test` (Vitest). Add focused tests with each behavior and run the relevant focused tests, then the repository test command as appropriate.
- Source implementation is authorized. This tracker-only delegated action updates no source code; implementation proceeds task-by-task under strict TDD.

## Tasks and work-unit plan

Each task is an independently reviewable behavior unit. Include tests with implementation and record exact evidence below. Forecasts are provisional and should be updated after code inspection; do not split merely by file type. No further commits or branch changes are authorized; remaining implementation stays uncommitted on `main`.

### T1 — Stop repeated route transition remounts

- **Behavior:** Remove the pathname-keyed animation remount/re-entry flicker while preserving normal route changes and not retaining inactive routes.
- **Forecast:** Route presentation/wrapper plus focused route-transition test(s); likely a small, cohesive work unit. Confirm exact files and authored line count before implementation.
- **Commit:** `fix(navigation): prevent repeated route transition remounts` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** A focused test demonstrates route changes do not trigger the repeated keyed remount/entry behavior; no inactive-route retention is introduced; existing route rendering behavior remains intact.
- **Verification:** Focused route test via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` if behavior is fully covered by the route test and no separate runtime boundary exists; otherwise record the exact scenario/result.
- **Rollback boundary:** Remove only this unit's route transition change and its focused test.
- **Selected route/files:** Removed the keyed Framer Motion wrapper and pathname subscription in `src/routes/app.tsx`; expanded `src/routes/app.test.tsx` to assert the Outlet subtree remains mounted while its child changes immediately and the prior route is absent. No route retention; animation removed for all motion preferences (reduced-motion users remain unanimated).
- **Evidence:** RED: focused test failed on the existing keyed wrapper (`outletMounts` increased 1→2). GREEN: `npm test -- src/routes/app.test.tsx` — 1 file passed, 1 test passed. Full suite: `npm test` — 20 files passed, 84 tests passed. `git diff --check` — passed. Runtime harness: N/A; the focused route test directly exercises subtree mount lifecycle and immediate child replacement. Auth behavior unchanged. Source commit on current `main`: `9dbfa21` (`fix(navigation): prevent repeated route transition remounts`); tracker documentation commit on current `main`: `65055ce` (`docs(odd): record route transition task evidence`).

### T2 — Stabilize attendance summary inputs and reads

- **Behavior:** Derive summaries from stable canonical attendance query data rather than using the complete attendance array as a query key; avoid redundant or sequential metadata/source reads. Preserve all current grouping and duplicate-handling semantics.
- **Forecast:** Summary derivation/query path and focused tests; potentially multiple implementation files, so delegate direct writing if the final implementation touches 2+ implementation files. Keep the behavior and its tests in one work unit.
- **Commit:** `fix(reports): stabilize attendance summary derivation` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** Focused tests prove stable summary identity/key behavior, no redundant/sequential source reads for the same data, and unchanged group and duplicate semantics, including existing edge cases.
- **Verification:** Focused report-summary tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` only if tests fully cover the query/data boundary; otherwise record exact scenario/result.
- **Rollback boundary:** Revert only this unit's summary/query derivation changes and associated tests.
- **Selected route/files:** `src/hooks/use-data.ts` attendance summary hooks now consume the existing canonical `useAsistencias`, `useCharlas`, and `useConfirmandos` query caches and derive results with `useMemo`; `src/hooks/use-data.test.tsx` asserts shared reads when both summaries mount against seeded attendance. Summary outputs no longer have independent array-keyed queries or metadata fetch chains.
- **TDD evidence:** RED: `npm test -- src/hooks/use-data.test.tsx` failed in the seeded-cache summary scenario because redundant calls were made (the test first exposed repeated metadata reads; its final assertions require exactly one canonical read for each metadata source and no attendance network read). GREEN: focused command passed, 1 file / 7 tests.
- **Verification:** `npm test -- src/hooks/use-data.test.tsx` — 1 file passed, 7 tests passed. `npm test` — 20 files passed, 84 tests passed. `git diff --check` — passed. `npx tsc --noEmit` — only existing unrelated `src/lib/dashboard-chart-data.ts(205,3): error TS6133` remains. Runtime harness: N/A; query-cache boundary and summary result behavior are tested directly.
- **Forecast / actual:** Forecast 3 files, approximately 50 additions / 40 deletions. Actual pre-commit diff: 3 files, 190 additions / 136 deletions (includes formatting in the focused hook/test regions and tracker evidence); no extra implementation files.
- **Rollback boundary:** Revert only the summary derivation changes in `src/hooks/use-data.ts` and corresponding regression assertion in `src/hooks/use-data.test.tsx`; retain all unrelated navigation work.
- **Commit:** Source commit on current `main`: `97e8251` (`fix(reports): stabilize attendance summary derivation`); tracker documentation commit on current `main`: `d94f64f` (`docs(odd): record attendance summary task evidence`).
- **Review evidence:** Native review for T1–T2 did not reach consent or a terminal result because status required `external.select_intended_untracked` capture, which was unavailable. No PASS is claimed.

### T3 — Keep dashboard trend live as summaries resolve

- **Behavior:** Derive dashboard trend from current summary state so it updates when the summary resolves, without hiding, clearing, or replacing already-cached stats.
- **Forecast:** Dashboard summary/trend derivation plus focused component/data-flow tests; keep behavior and tests together.
- **Commit:** None. No commit was made or authorized; T3 remains uncommitted on `main`.
- **Acceptance:** Tests show the trend updates after summary resolution and cached stats remain visible throughout loading/resolution; no stale snapshot is presented as final.
- **Verification:** Focused dashboard tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` if component tests exercise the asynchronous state transition; otherwise record exact scenario/result.
- **Rollback boundary:** Remove only the trend derivation/update and its focused tests.
- **Selected route/files:** `src/routes/app.index.tsx` derives `attendanceTrend` from the live `resumen` at approximately line 200; the chart loading prop uses `loadingResumen`. Added async summary-resolution regression coverage in `src/routes/app.index.test.tsx`.
- **TDD evidence:** Strict TDD RED was observed and passed. GREEN: `npm test -- src/routes/app.index.test.tsx` — 1 test passed; parent focused rerun also passed 1 test. Full suite: `npm test` — 21 files passed, 85 tests passed. `git diff --check` — passed. Implementation remains uncommitted on `main` as directed; no commit identity applies.

### T4 — Add bounded authenticated catalog warmup

- **Behavior:** Prefetch only common, non-financial authenticated catalogs, non-blockingly and within a bounded allowlist, after session and role readiness. Reuse the exact consumer query keys/options. Cancel or isolate outstanding work and cached results on logout/account change; never warm financial data.
- **Forecast / actual:** Auth/session readiness, provider warmup, shared query-options factories, and lifecycle/query-option tests. Actual working-tree T4 diff is recorded after implementation in the final session report; no commit is authorized.
- **Commit:** None. No commit was made or authorized; T4 remains uncommitted on `main`. No commit identity applies.
- **Acceptance:** Tests prove warmup is non-blocking and bounded; it starts only after both session and role readiness; only allowlisted non-financial catalogs are prefetched; keys/options match consumers; logout/account switch cancels or isolates prior-account work and cache; no full-table or financial fetch is introduced.
- **Verification:** Focused warmup/auth lifecycle tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: record an authenticated navigation scenario and exact result if a runtime boundary is exercised; otherwise explain why `N/A`.
- **Rollback boundary:** Remove only the warmup integration/allowlist and its focused tests; preserve unrelated query behavior.
- **Selected route/files:** `src/hooks/use-data.ts` exports `charlasListQueryOptions` and `gruposSimpleQueryOptions`; normal hooks consume those exact factories. `src/components/AppProviders.tsx` launches only those two prefetches after user, session initialization, and successful role readiness. `src/hooks/use-auth.tsx` exposes `rolesReady`, leaves it false on role errors/refresh, and synchronously clears the shared QueryClient on identity changes. Tests are in `src/components/AppProviders.test.tsx`, `src/hooks/use-auth.test.tsx`, and `src/hooks/use-data.test.tsx`.
- **TDD evidence:** RED: `npm test -- src/components/AppProviders.test.tsx src/hooks/use-auth.test.tsx` — 2 files failed, 3 tests failed because `rolesReady` was absent and the authenticated application remained behind the auth loader in the warmup scenario. GREEN: `npm test -- src/components/AppProviders.test.tsx src/hooks/use-auth.test.tsx src/hooks/use-data.test.tsx` — 3 files passed, 18 tests passed.
- **Verification:** Focused command above — 3 files / 18 tests passed. Final `npm test` — 21 files / 89 tests passed. Final `npx tsc --noEmit` reports only the known baseline `src/lib/dashboard-chart-data.ts:205` TS6133 diagnostic (`'now' is declared but its value is never read`). The targeted Prettier check on the listed files passes after normalizing six files. Final `git diff --check` passes. Warmup is non-blocking and capped at two concurrent lightweight projections; tests establish unauthenticated no-prefetch, role readiness gating, and shared query caches. Runtime harness: N/A; provider/auth/query lifecycle is exercised directly by focused tests. Cache clear uses synchronous `QueryClient.clear()` only on identity changes (not same-user token refresh); this removes prior cached results and disposes old queries before new identity state is published. Final repository state: branch `main`; source, test, and task-tracker edits remain uncommitted and unstaged.
- **Rollback boundary:** Remove only the provider warmup, `rolesReady`/identity cache lifecycle additions, two shared query factories, and their focused regression tests; preserve T1–T3 changes.
- **Commit:** None. No commit was made or authorized; T4 remains uncommitted on `main`. No commit identity applies.

## Progress and evidence

- **Feature proposal reconciliation:** This tracker operationalizes the user's previously explained feature proposal into four behavior-first work units (T1–T4) with tests, rollback boundaries, and commit evidence. No separate proposal file was present in the repository at tracker creation; if its canonical location is identified during implementation, reconcile any scope or acceptance differences here before proceeding.
- **Historical branch context:** An earlier tracker version described `feat/smooth-route-navigation` and a local branch repair. That is not the current branch and must not be recreated or switched to. Current branch is `main`.
- **Initial worktree evidence:** Existing unrelated untracked `.opencode/` and `AGENTS.md`; preserve both. No other changes were reported by the initial status check.
- **Inspection evidence supplied by user:** shared QueryClient staleTime is 30 seconds and has no query-level key factories; App route uses a pathname-keyed motion wrapper; report summaries key on the full attendance array and re-fetch metadata; dashboard stats snapshot summary-derived trend.
- **Historical T1 assessment:** Previously recorded for a then-current `main..HEAD`: `medium` / `executable_change` on `src/routes/app.test.tsx`; 3 changed paths / 141 lines; `review_due:false`; reason: `under_budget`. This is historical evidence, not a current-branch review result. Unrelated untracked `.opencode/` and `AGENTS.md` were explicitly excluded. Parent spot check passed: `npm test -- src/routes/app.test.tsx` (1 file/1 test) and `git diff --check`.
- **Current branch/history:** Current branch is `main`. T1 source `9dbfa21`, T1 tracker documentation `65055ce`, T2 source `97e8251`, and T2 tracker documentation `d94f64f` are present in main history. These identities describe current history only; they do not assert who created or pushed the commits. No remote operations are reported.
- **Final task status:** T1–T4 implementation and verification are complete, but native review is not approved. T1–T2 review did not reach consent or a terminal result because the required `external.select_intended_untracked` capture was unavailable; do not claim a review PASS.
- **Final worktree state:** Branch `main`; T3/T4 source and test changes and this task-tracker update remain uncommitted and unstaged. No further commits, staging, branch changes, push, or remote operations are authorized.

## Delivery strategy and task closeout

- Forecast each task's authored additions plus deletions and update the running total from work-unit commits. If projected review size approaches 400 lines, choose an honest cohesive chain strategy per the work-unit-commits skill; do not compress code/tests to fit.
- For each completed task, record: selected implementation route/files, authored line forecast and actual when available, focused test command and exact result, runtime harness scenario/result or explicit `N/A` reason, applicable history identity, and rollback boundary.
- Implementation is authorized on `main`, but all further work must remain uncommitted. No additional commits, branch changes, staging, or remote operations are authorized. This tracker update is tracker-only.
