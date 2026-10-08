# Smooth Route Navigation — ODD Task Tracker

## User problem and intent

Navigation currently repeats visual route transitions, attendance report summaries churn their query key with the full attendance array and fetch redundant metadata, and dashboard trend data can remain a snapshot after summaries resolve. The user authorized the previously explained fixes, including a safe, bounded authenticated warmup strategy. This tracker is the implementation plan and evidence ledger for that work.

## Skills to load before work

- `/home/mauricio/.agents/skills/work-unit-commits/SKILL.md` — required before task-specific implementation work.

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
- Implementation is explicitly authorized by the user. Every substantial ODD task must close with a required work-unit commit, following the skill and task plans below.
- Push and PR remain unauthorized; do not perform remote operations.

## Resolved verification configuration

- Strict TDD remains active, per the user's prior selection.
- Exact test runner: `npm test` (Vitest). Add focused tests with each behavior and run the relevant focused tests, then the repository test command as appropriate.
- Source implementation is authorized. This tracker-only delegated action updates no source code; implementation proceeds task-by-task under strict TDD.

## Tasks and work-unit plan

Each task is an independently reviewable behavior unit. Implementation must include tests in the same work unit, use a Conventional Commit, and record the resulting commit identity and exact evidence below. Forecasts are provisional and should be updated after code inspection; do not split merely by file type.

### T1 — Stop repeated route transition remounts

- **Behavior:** Remove the pathname-keyed animation remount/re-entry flicker while preserving normal route changes and not retaining inactive routes.
- **Forecast:** Route presentation/wrapper plus focused route-transition test(s); likely a small, cohesive work unit. Confirm exact files and authored line count before implementation.
- **Commit:** `fix(navigation): prevent repeated route transition remounts` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** A focused test demonstrates route changes do not trigger the repeated keyed remount/entry behavior; no inactive-route retention is introduced; existing route rendering behavior remains intact.
- **Verification:** Focused route test via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` if behavior is fully covered by the route test and no separate runtime boundary exists; otherwise record the exact scenario/result.
- **Rollback boundary:** Remove only this unit's route transition change and its focused test.
- **Selected route/files:** Removed the keyed Framer Motion wrapper and pathname subscription in `src/routes/app.tsx`; expanded `src/routes/app.test.tsx` to assert the Outlet subtree remains mounted while its child changes immediately and the prior route is absent. No route retention; animation removed for all motion preferences (reduced-motion users remain unanimated).
- **Evidence:** RED: focused test failed on the existing keyed wrapper (`outletMounts` increased 1→2). GREEN: `npm test -- src/routes/app.test.tsx` — 1 file passed, 1 test passed. Full suite: `npm test` — 20 files passed, 84 tests passed. `git diff --check` — passed. Runtime harness: N/A; the focused route test directly exercises subtree mount lifecycle and immediate child replacement. Auth behavior unchanged. Commit: `fix(navigation): prevent repeated route transition remounts` (hash recorded in Progress after commit).

### T2 — Stabilize attendance summary inputs and reads

- **Behavior:** Derive summaries from stable canonical attendance query data rather than using the complete attendance array as a query key; avoid redundant or sequential metadata/source reads. Preserve all current grouping and duplicate-handling semantics.
- **Forecast:** Summary derivation/query path and focused tests; potentially multiple implementation files, so delegate direct writing if the final implementation touches 2+ implementation files. Keep the behavior and its tests in one work unit.
- **Commit:** `fix(reports): stabilize attendance summary derivation` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** Focused tests prove stable summary identity/key behavior, no redundant/sequential source reads for the same data, and unchanged group and duplicate semantics, including existing edge cases.
- **Verification:** Focused report-summary tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` only if tests fully cover the query/data boundary; otherwise record exact scenario/result.
- **Rollback boundary:** Revert only this unit's summary/query derivation changes and associated tests.
- **Evidence:** Pending implementation.

### T3 — Keep dashboard trend live as summaries resolve

- **Behavior:** Derive dashboard trend from current summary state so it updates when the summary resolves, without hiding, clearing, or replacing already-cached stats.
- **Forecast:** Dashboard summary/trend derivation plus focused component/data-flow tests; keep behavior and tests together.
- **Commit:** `fix(dashboard): update trend when summaries resolve` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** Tests show the trend updates after summary resolution and cached stats remain visible throughout loading/resolution; no stale snapshot is presented as final.
- **Verification:** Focused dashboard tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: `N/A` if component tests exercise the asynchronous state transition; otherwise record exact scenario/result.
- **Rollback boundary:** Remove only the trend derivation/update and its focused tests.
- **Evidence:** Pending implementation.

### T4 — Add bounded authenticated catalog warmup

- **Behavior:** Prefetch only common, non-financial authenticated catalogs, non-blockingly and within a bounded allowlist, after session and role readiness. Reuse the exact consumer query keys/options. Cancel or isolate outstanding work and cached results on logout/account change; never warm financial data.
- **Forecast:** Auth/session readiness integration, bounded catalog selection, and focused lifecycle/query-option tests. If this touches 2+ implementation files, use a delegated direct writer per the ODD task constraint. Keep warmup, lifecycle safety, and tests in one coherent work unit; do not create a broad eager-fetch layer.
- **Commit:** `perf(navigation): prefetch bounded authenticated catalogs` (proposed; adjust to actual behavior and repository style).
- **Acceptance:** Tests prove warmup is non-blocking and bounded; it starts only after both session and role readiness; only allowlisted non-financial catalogs are prefetched; keys/options match consumers; logout/account switch cancels or isolates prior-account work and cache; no full-table or financial fetch is introduced.
- **Verification:** Focused warmup/auth lifecycle tests via `npm test -- <focused test path>` (record exact result); `npm test` (record exact result). Runtime harness: record an authenticated navigation scenario and exact result if a runtime boundary is exercised; otherwise explain why `N/A`.
- **Rollback boundary:** Remove only the warmup integration/allowlist and its focused tests; preserve unrelated query behavior.
- **Evidence:** Pending implementation.

## Progress and evidence

- **Feature proposal reconciliation:** This tracker operationalizes the user's previously explained feature proposal into four behavior-first work units (T1–T4) with tests, rollback boundaries, and commit evidence. No separate proposal file was present in the repository at tracker creation; if its canonical location is identified during implementation, reconcile any scope or acceptance differences here before proceeding.
- **Initial branch:** `feat/smooth-route-navigation`.
- **Initial worktree evidence:** Existing unrelated untracked `.opencode/` and `AGENTS.md`; preserve both. No other changes were reported by the initial status check.
- **Inspection evidence supplied by user:** shared QueryClient staleTime is 30 seconds and has no query-level key factories; App route uses a pathname-keyed motion wrapper; report summaries key on the full attendance array and re-fetch metadata; dashboard stats snapshot summary-derived trend.
- **Current task:** T1 — Stop repeated route transition remounts. Implementation is authorized and must follow strict TDD; close the task with its required ODD work-unit commit and record evidence above.
- **T1 actual:** 3 files; 19 additions / 28 deletions (net -9); work-unit commit identity recorded in the T1 evidence above and completed commit hash below.
- **Next tasks:** T2 — Stabilize attendance summary inputs and reads; T3 — Keep dashboard trend live as summaries resolve; T4 — Add bounded authenticated catalog warmup. Complete each as a separate behavior-first task/work-unit commit, preserving the scope, acceptance criteria, and rollback boundary defined above.

## Delivery strategy and task closeout

- Forecast each task's authored additions plus deletions and update the running total from work-unit commits. If projected review size approaches 400 lines, choose an honest cohesive chain strategy per the work-unit-commits skill; do not compress code/tests to fit.
- For each completed task, record: selected implementation route/files, authored line forecast and actual, focused test command and exact result, runtime harness scenario/result or explicit `N/A` reason, Conventional Commit identity, and rollback boundary.
- Implementation and the required ODD work-unit commits for T1–T4 are authorized. This tracker update itself is tracker-only and creates no commit. Push, PR, and other remote operations remain unauthorized without separate authorization.
