# Orbit · Your work, in motion

A responsive Kanban workspace built with React, TypeScript, Vite, and Supabase. Four columns, thoughtful interaction states, and a complete task-detail workflow—without a separate server or paid services.

**GitHub and Supabase are connected and verified.** The code is pushed to the private [EverettWuCoding/orbit-task-board repository](https://github.com/EverettWuCoding/orbit-task-board). A dedicated free Supabase project is provisioned, with anonymous Auth, RLS, transactional RPCs and Realtime checked against the actual hosted database. This workspace's ignored local environment file connects the frontend to it; a fresh clone without config remains a local demo.

**Live frontend: https://everettwucoding.github.io/orbit-task-board-demo/** — free account-owned GitHub Pages hosting, HTTPS enforced, no purchased domain and no temporary-deployment expiry. The actual hosted UI passed guest isolation, persistence, all seven advanced categories, pointer append/reorder and cross-tab Realtime acceptance. Only compiled assets are public; the source repository and private handoff documents remain separate. See [docs/CLOUD_HANDOFF.md](docs/CLOUD_HANDOFF.md).

## Start locally

Requires **Node.js 22.12+** (Node 24 LTS recommended) and npm. Python is not an application dependency; the local Python environment was used only to read the assessment PDF.

1. Run `npm ci`.
2. Run `npm run dev`.
3. Open http://127.0.0.1:5173.

Without Supabase environment variables, Orbit starts in an explicitly labeled **local demo**, with eight example tasks. Changes persist in this browser's local storage; a new browser context receives a separate demo workspace. The “Reset demo” action requires confirmation and only affects this local data.

For the required cloud-backed version, follow [docs/SETUP.md](docs/SETUP.md). Configuration must be present when building; Vite environment variables are compiled into the frontend bundle.

## Features

- **Four-column board:** To Do, In Progress, In Review, Done.
- **Drag and drop:** cross-column status changes and same-column reordering, persisted on drop. Optimistic moves roll back on write failure. Pointer and keyboard sensors; touch-safe grip handles.
- **Task management:** create, edit, delete, descriptions, low/normal/high priorities, due dates, an optional assignee, and multiple labels.
- **Guest authentication:** automatic Supabase anonymous sign-in; refreshes and subsequent visits reuse the browser session.
- **Private persistence:** all six application tables have RLS. Composite owner foreign keys block cross-guest assignments, tags, and comments.
- **Team roster:** names, colors, initials, task counts, and safe removal/unassignment. This is a personal roster, **not** shared multi-user collaboration or invitations.
- **Comments:** chronological, timestamped, stored separately, with length limits and safe React text rendering.
- **Activity timeline:** database-generated task creation, edits, status, priority, dates, assignment and label changes. Reordering alone does not generate noisy history.
- **Labels:** create custom labels, attach several to a task, filter by label, and remove labels without removing tasks.
- **Focus controls:** title search, combined priority/assignee/label filters, unassigned filter, due-soon and overdue views, and a compact list view.
- **Due indicators:** date-only comparisons in the user's local calendar; overdue and next-two-day badges; completed tasks never count as overdue.
- **Summary:** total, completed, overdue, and completion percentage, always calculated over the entire board rather than only the filtered subset.
- **Usability:** loading skeletons, helpful connection errors, save states, confirmation before deletion, success announcements, empty states, retry loading, and render-error recovery.
- **Accessibility:** native dialog focus trapping/restoration, explicit labels, visible focus, skip link, drag announcements, keyboard status alternatives, reduced motion, and readable custom colors.
- **Responsive layout:** four columns on wide screens, two on tablets, stacked columns on phones; mobile navigation and dialogs; no page-level horizontal scrolling at a verified 360px viewport.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Strict TypeScript validation and production build |
| `npm run preview` | Serve the built frontend locally |
| `npm run lint` | ESLint |
| `npm test` | Business rules, repositories, hooks, and real PostgreSQL schema/RLS tests |
| `npm run test:e2e` | Chromium desktop/mobile workflows and automated accessibility checks |
| `npm run test:production` | Test built assets, responsive widths, accessibility and persistence; save screenshots (demo build only) |
| `npm run verify:supabase` | Real hosted backend checks using two anonymous clients and public key; cleans temporary test rows |
| `npm run verify:cloud-browser` | Real browser guest/persistence/Realtime checks; optional frontend URL argument |
| `npm run check` | Lint, unit/database tests, and production build |
| `npm run submission` | Generate the named PDF and editable Word submission; draft safeguards apply if verification/config is incomplete |

Before browser tests, install Chromium with `npx playwright install chromium`. End-to-end tests always start an isolated local-demo server on port 5180 and never reuse the cloud-connected development server on port 5173. Demo tests do not write to Supabase. The separate explicit live-verification scripts create/remove their own temporary guest-owned test records.

## Structure

- [src/App.tsx](src/App.tsx): workspace layout, navigation, filters, state views.
- [src/components](src/components): board, cards, task dialog, management dialogs, accessible primitives.
- [src/hooks/useBoard.ts](src/hooks/useBoard.ts): initialization, realtime refresh, write serialization and optimistic rollback.
- [src/lib/domain.ts](src/lib/domain.ts): pure filters, dates, statistics, validation and ordering.
- [src/lib/supabase.ts](src/lib/supabase.ts): anonymous authentication, paginated reads, transactional RPCs and realtime subscriptions.
- [src/lib/demo.ts](src/lib/demo.ts): deliberately separate local-preview storage adapter.
- [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql): full schema, indexes, RLS, functions, triggers, privileges and realtime publication.
- [tests/database.test.ts](tests/database.test.ts): actual migration executed with PGlite/PostgreSQL; not mocked SQL.
- [e2e](e2e): Playwright workflows and axe WCAG checks.
- [docs](docs): setup, design, requirements, verification and deployment instructions.
- [scripts/generate-submission.mjs](scripts/generate-submission.mjs): generates the requested submission documents with the complete SQL schema.

## Verification and limitations

The original PDF has been audited bullet by bullet in [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Remaining owner submission actions and optional feature/quality work are in [docs/REMAINING_WORK.md](docs/REMAINING_WORK.md). All seven advanced categories are present, with one assignee per task; multiple simultaneous assignees are not implemented.

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for the tested scope. The final rerun passed **48 unit/database tests, 20 browser tests (4 deliberately skipped mobile physical-input cases), hosted advanced-feature/pointer workflows, live Supabase isolation and production smoke checks**. Both GitHub Linux CI for the application fix and the updated Pages deployment passed. Physical-phone touch gestures and comprehensive assistive-technology certification are not claimed.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions and tradeoffs. This is a single-board, personal guest workspace. Clearing browser auth storage loses access to an anonymous guest's cloud data. No account-recovery or shared team permissions are claimed.

## Deployment and submission

The submission config includes Everett Wu, the actual private source GitHub URL and the verified live Pages URL. `npm run submission` generates both named formats with the full SQL schema and current setup/features/tradeoffs. Submit **one** finished document after inspecting it; Google Drive upload, reviewer permissions and the actual invitation's Google Form are owner handoff steps and have not been performed. See [docs/CLOUD_HANDOFF.md](docs/CLOUD_HANDOFF.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Confidentiality:** the supplied assessment PDF is ignored by Git, as are generated PDFs/Word files and local environment files. Do not upload the assessment PDF, publish the final submission document/link on public profiles, or expose a Supabase service-role/secret key. Only the public publishable or legacy anon key belongs in the browser. Use a private GitHub repository if preferred and share it directly with the reviewer.