# Verification scope and handoff checks

## Automated local checks

### Latest verified results

- ESLint: **passed**, no errors or warnings.
- Strict TypeScript and Vite production build: **passed**, split vendor chunks and no oversized-chunk warning.
- Unit/repository/hook/PostgreSQL suite: **42 passed**, including **18 actual database tests**.
- Chromium desktop/mobile suite: **19 passed**, **3 intentionally skipped** mobile-profile physical keyboard/pointer scenarios. No failures.
- Axe checks: **passed** on board, task creation dialog and quick guide in both browser profiles; the built desktop board also passed.
- Production-bundle smoke: **passed** with no page runtime/network failures; measured **360, 768, 1024 and 1440px** layouts without page-level horizontal overflow; mobile creation/status and refresh persistence verified.
- Dependency audit: **0 known vulnerabilities** across installed runtime and development dependencies at the time of verification.
- Submission generation: **7-page draft PDF** and editable Word file generated. Independently parsed both documents and verified that the **complete SQL migration** is present, including its final `commit;`.
- Local Git repository initialized on `main`; assessment PDF, local env files, Python environment and generated private PDF/Word documents confirmed ignored. No remote was created and nothing was published.

Run `npm run check` and `npm run test:e2e` from the root. Chromium installation is a one-time prerequisite. Browser tests deliberately run in **local demo** mode and never exercise a production database.

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

## Live acceptance checklist — not completed by local tests

The owner must complete these after configuring the external services:

### Database and anonymous auth

- [ ] Supabase free project exists and is healthy/unpaused.
- [ ] Complete migration ran without error; RLS enabled on all six tables.
- [ ] Anonymous Sign-Ins enabled; application uses only a public publishable/anon key.
- [ ] Hosted app shows “Private workspace,” not “Local demo.”
- [ ] Guest A creates a task, refreshes, and retains both task and guest identifier.
- [ ] A different browser/incognito guest B starts with its own empty board.
- [ ] Neither guest can see or change the other guest's tasks or related records.
- [ ] Status and position survive refresh after dragging.
- [ ] Members, tags, comments and database activity survive refresh.
- [ ] Same-guest tabs receive Realtime updates; different guests do not receive private task contents.

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

Local SQL tests already exercise these database rules with real PostgreSQL roles. The live check additionally confirms the actual project/auth/API configuration. Never disable RLS to make a test pass.

### Hosting, accessibility and handoff

- [ ] GitHub repository contains intended source only; no confidential PDF, secrets or generated private handoff documents in commit history.
- [ ] Deployment is on a free plan and builds successfully using the lockfile.
- [ ] HTTPS live URL loads in a fresh browser, with no console/network errors.
- [ ] Keyboard creation, navigation, focus return, drag/status alternatives and reduced motion work.
- [ ] Actual phone touch drag and form behavior verified; narrow page has no horizontal overflow.
- [ ] Supabase rate limits/CAPTCHA settings match the implemented anonymous signup flow.
- [ ] Name, live URL, GitHub URL and confirmed verification supplied in submission config.
- [ ] Generated PDF opened and inspected; full SQL is present and no DRAFT marker remains.
- [ ] Final document shared through the requested private Drive/Form process only.

## Important distinctions

Local demo identity isolation is **not** Supabase Auth isolation. A successful production build is **not** a live deployment. Local PGlite tests are **not** a Supabase service integration test. A green axe result is **not** a complete WCAG or screen-reader certification. The README and generated draft intentionally preserve these distinctions.