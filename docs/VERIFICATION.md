# Verification scope and handoff checks

## Automated local checks

### Latest verified results

- ESLint: **passed**, no errors or warnings.
- Strict TypeScript and Vite production build: **passed**, split vendor chunks and no oversized-chunk warning.
- Unit/repository/hook/PostgreSQL/collision suite: **48 passed**, including **18 actual database tests** and **6 direct nested-drag collision regressions**.
- Chromium desktop/mobile suite: **20 passed**, **4 intentionally skipped** mobile-profile physical keyboard/pointer scenarios. No failures; final local full run used zero retries.
- Targeted append/reorder and outside-board cancellation stress: **10 passed** (five of each), without retries. The original off-viewport gesture was reproduced before fixing; assertions were preserved/strengthened, not skipped.
- Axe checks: **passed** on board, task creation dialog and quick guide in both browser profiles; the built desktop board also passed.
- Production-bundle smoke: **passed** with no page runtime/network failures; measured **360, 768, 1024 and 1440px** layouts without page-level horizontal overflow; mobile creation/status and refresh persistence verified.
- Dependency audit: **0 known vulnerabilities** across installed runtime and development dependencies at the time of verification.
- Submission generation: **named 7-page final PDF and editable Word file regenerated and validated**. Both contain full migration SQL, all required sections, real clickable live/source links and no DRAFT/PENDING markers. Representative rendered pages and page-bound checks passed. Private Drive/Form delivery remains an owner action.
- Private GitHub repository pushed on `main`; assessment PDF, local env files, Python environment and generated private PDF/Word documents confirmed ignored and absent from Git history's file paths.

### Follow-up cloud verification

The private GitHub repository is pushed, and a dedicated free Supabase project is connected. After the regression fixes, live SDK and actual HTTPS browser checks passed for anonymous guest separation, session/reload, all six owned tables, cross-guest adversarial operations, atomic rollback, all seven advanced categories and Realtime/cross-tab delivery. Actual pointer cross-column moves, blank-column appends and same-column reorder persist after reload. Temporary application test data was removed. Application fix [8a95f27 passed Linux CI](https://github.com/EverettWuCoding/orbit-task-board/actions/runs/41400882418); the [updated Pages deployment](https://github.com/EverettWuCoding/orbit-task-board-demo/actions/runs/41400943222) also passed. See [CLOUD_HANDOFF.md](CLOUD_HANDOFF.md).

**Verified live frontend: https://everettwucoding.github.io/orbit-task-board-demo/** — free account-owned HTTPS Pages site, not the old expiring Vercel URL. Hosting and hosted acceptance are complete; **private Google Drive/Form submission has not been performed**. The full PDF-derived checklist is [REQUIREMENTS.md](REQUIREMENTS.md); remaining owner/optional work is [REMAINING_WORK.md](REMAINING_WORK.md).

Run `npm run check` and `npm run test:e2e` from the root. Chromium installation is a one-time prerequisite. Browser tests deliberately run in **local demo** mode on their own port 5180 and never reuse a cloud-configured development server. Explicit live verification scripts are separate and clean temporary application records.

Tests include:

- **Pure domain logic:** status transitions and ordering, combined filters, unassigned/due filters, local-calendar due dates, completed-date exemption, statistics, limits and error messages.
- **Local preview persistence:** initial seed is written once; a browser reuses its preview identity; edits/comments/history survive a new repository instance; deletion cascades; safe member/label removal; invalid references and corrupt/unavailable storage are rejected.
- **Supabase client authentication:** stored sessions do not trigger another signup; simultaneous anonymous sign-ins share a promise; auth failures can be retried; public key formats are accepted and service-role/secret keys are rejected.
- **Mutation reliability:** failed optimistic moves restore prior board state; confirmed writes followed by read failures are reported without encouraging a duplicate submission.
- **Actual PostgreSQL SQL/RLS:** the complete migration is executed in PGlite (PostgreSQL WASM). Minimal test `auth.users` and `auth.uid()` stubs model Supabase guest identities; tests switch the real database role to `authenticated`/`anon`.
- **Adversarial database checks:** B cannot read/update/delete A's task; spoofed/changed ownership is blocked; unauthenticated roles have no table/RPC access; all dependent tables are isolated; cross-guest member/label/comment links fail; task-label saves and move batches roll back atomically; history cannot be forged/changed/deleted; defaults, checks, uniqueness and cascading cleanup work.
- **Desktop/mobile Chromium:** task CRUD, refresh persistence, assignee/tags, comments/history, team and label creation, filters and list view, empty search, separate local guest contexts, corrupt-data errors and a measured 360px layout.
- **Desktop-specific input:** actual pointer dragging across columns and within-column reorder persist after refresh; keyboard shortcuts and dialog initial focus are tested.
- **Keyboard dragging:** logical left/right status navigation, independent of nested droppable columns; pickup, drop and refresh persistence are verified on desktop.
- **Accessibility:** axe WCAG A/AA checks on the board, create-task dialog and quick guide. Automated checks supplement—but do not replace—manual assistive-technology review.

`npm run test:production` additionally starts the built preview on port 4173, confirms the local-demo build before writing any test task, checks for runtime/network errors, runs axe, measures 360/768/1024/1440px layouts, verifies mobile creation/status/persistence, and saves [desktop](screenshots/desktop-board.png) and [mobile](screenshots/mobile-board.png) screenshots. Use a demo build for this smoke test; it refuses to create cloud-backed test tasks.

The browser project intentionally skips physical-keyboard/pointer-specific scenarios on its mobile profile. This is not a claim of tested physical mobile gestures. Verify touch dragging on actual iOS/Android devices before claiming device coverage.

## Live backend checklist — completed separately from local tests

These boxes are backed by separate live SDK/browser evidence, not merely the local PGlite tests. During the requirements audit, project health, live column types and six-table RLS were rechecked without creating new test data.

### Database and anonymous auth

- [x] Supabase dedicated free/default nano project exists and is healthy/unpaused. Owner billing/host plan confirmation still listed in the remaining-work checklist.
- [x] Complete migration ran without error; RLS enabled on all six tables.
- [x] Anonymous Sign-Ins enabled; application uses only a public publishable/anon key.
- [x] Local frontend connected to real Supabase shows “Private workspace,” not “Local demo.”
- [x] Guest A creates a task, refreshes, and retains both task and guest identifier through the local frontend/cloud backend.
- [x] A different browser guest B starts with its own empty board.
- [x] Neither guest can see/change the other's tasks; live adversarial link/ownership checks passed.
- [x] Move RPC saves actual status/position; local and actual hosted pointer append/reorder tests verify on-drop persistence. Keyboard navigation is separately desktop-tested.
- [x] Cloud member/label links, comments and trigger-generated activity persisted/read back; browser task/comment/activity reload verified.
- [x] Same-guest tabs receive Realtime updates; guest ownership enforced in live reads and RLS.
- [x] Repeat guest/feature acceptance on the actual HTTPS frontend, including all seven advanced categories and pointer moves/reorder.
- [ ] Verify physical phone touch drag, not merely mobile form/layout emulation.

### Live adversarial RLS test

In a **disposable** Supabase project, use two separate authenticated guest clients A and B, each with its own user access token. Keep tokens outside chat and do not commit them. These operations can be performed from a local test script/SDK session or a REST client:

1. A creates a task and a member/label; retain their IDs.
2. B queries A's task ID: zero rows.
3. B updates/deletes A's task: no affected row; A's original task remains.
4. B inserts a row with `user_id = A`: rejected by RLS.
5. B calls `save_task` to edit A's ID: rejected, without changing A's task.
6. B creates its own task with A's assignee/label: rejected by composite foreign keys, and no partial task/label write remains.
7. B attaches a comment/link to A's task: rejected.
8. Authenticated A attempts direct activity insert/update/delete: denied.
9. An unauthenticated public client without a user session attempts application reads/RPCs: denied.

These live SDK checks were completed with [verify-supabase](../scripts/verify-supabase.mjs), including temporary-record cleanup; no need to redo them from scratch to create the database. Local SQL tests independently exercise the rules with real PostgreSQL roles. Repeat critical guest behavior on the final hosted origin after deployment. Never disable RLS to make a test pass.

### Hosting, accessibility and handoff

- [x] GitHub repository contains intended source; confidential PDF, local env and generated private documents are ignored and absent from Git history file paths; prior staged secret checks passed.
- [x] GitHub Pages free public-assets hosting is built successfully; private source CI installs the lockfile and checks the production build.
- [x] HTTPS live URL loads in fresh browser contexts; hosted smoke passed no page/asset errors and selected axe/360px layout checks.
- [x] Keyboard creation, drag/status alternatives and dialog initial focus implemented; desktop automated checks passed. Reduced-motion styles provided.
- [ ] Final manual keyboard/focus/assistive-technology review on hosted domain; ARIA tab-pattern improvements are optional backlog, not certified complete.
- [ ] Actual phone touch drag and form behavior verified; narrow page has no horizontal overflow.
- [x] Actual anonymous signup works with current Supabase settings; frontend has no CAPTCHA integration. Do not enable mandatory CAPTCHA without implementing it.
- [x] Name and actual GitHub URL supplied in submission config.
- [x] Account-owned Pages live URL and confirmed hosted verification supplied in submission config.
- [x] Final PDF/Word contents and hyperlinks independently parsed; full SQL present, no draft markers, rendered overview/features/schema/end pages reviewed without clipping.
- [ ] Owner personally reviews the final named document before uploading.
- [ ] Final document shared through the requested private Drive/Form process only.

## Important distinctions

Local demo identity isolation is **not** Supabase Auth isolation. A successful production build is **not** a live deployment. Local PGlite tests are **not** a Supabase service integration test. A green axe result is **not** a complete WCAG or screen-reader certification. The README and generated draft intentionally preserve these distinctions.