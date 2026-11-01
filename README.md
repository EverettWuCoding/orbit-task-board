# Orbit · Your work, in motion

A responsive Kanban workspace built with React, TypeScript, Vite, and Supabase. Four columns, thoughtful interaction states, and a complete task-detail workflow—without a separate server or paid services.

**The application is implemented locally. A live assessment submission still requires configuring a Supabase project, pushing the code to your GitHub account, and deploying the frontend. The default local demo is not a substitute for those requirements.**

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
| `npm run check` | Lint, unit/database tests, and production build |
| `npm run submission` | Generate a PDF and editable Word submission draft |

Before browser tests, install Chromium with `npx playwright install chromium`. End-to-end tests explicitly use local-demo environment variables. If reusing a running server, it must also be in demo mode; stop a cloud-configured server before these tests. Tests do not write to a production Supabase database.

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

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for the tested scope and the live checks still needed. PostgreSQL ownership/transaction tests run locally with a minimal `auth.uid()` implementation. They verify the database rules but **do not** establish that an external Supabase project, hosted anonymous auth, or Realtime has been configured successfully.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions and tradeoffs. This is a single-board, personal guest workspace. Clearing browser auth storage loses access to an anonymous guest's cloud data. No account-recovery or shared team permissions are claimed.

## Deployment and submission

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for GitHub and free-tier Vercel/Netlify deployment. No cloud resources are created automatically. Fill in [submission/submission.config.json](submission/submission.config.json), then run `npm run submission`. Both PDF and Word files contain the full SQL schema and are marked **DRAFT** until name, URLs and live verification are supplied.

**Confidentiality:** the supplied assessment PDF is ignored by Git, as are generated PDFs/Word files and local environment files. Do not upload the assessment PDF, publish the final submission document/link on public profiles, or expose a Supabase service-role/secret key. Only the public publishable or legacy anon key belongs in the browser. Use a private GitHub repository if preferred and share it directly with the reviewer.