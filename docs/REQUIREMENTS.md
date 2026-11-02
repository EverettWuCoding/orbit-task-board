# Assessment requirements audit and checked checklist

**Audited: November 1, 2026.** Compared against all six pages of the original confidential assessment PDF, actual source/schema, generated deliverables, prior test results and current cloud checks. This is a solution-specific evaluation, not a copy of the assessment.

## Bottom line

- **Core application and Supabase requirements: implemented.** The local frontend connects to a verified real Supabase database, not just browser storage.
- **All seven advanced-feature categories: implemented**, with single-assignee/color-initial-avatar scope explained below. Multiple simultaneous assignees and uploaded avatar photos are not implemented.
- **Application readiness: verified.** The free account-owned [HTTPS frontend](https://everettwucoding.github.io/orbit-task-board-demo/) passed hosted guest isolation, all seven advanced categories, pointer append/reorder and reload persistence. The original CI failure and an additional append-area defect are fixed; Linux CI and Pages deployment passed.
- **Document readiness: finalized and validated.** The named 7-page PDF and Word file include all seven required content items, real clickable live/source URLs, full SQL and no draft markers. Complete SQL/hyperlink extraction, page bounds and representative visual layouts passed. Private Drive/Form delivery and the owner's human review remain distinct, unperformed actions.
- **No mandatory board feature is missing.** Remaining required work is final document inspection and private submission—not another backend or unrelated product enhancements.

### How to read the boxes

`[x]` means implemented/prepared and supported by stated evidence. `[ ]` means not completed, not implemented, or not yet verified as specified. The expanded hosted acceptance now covers all seven advanced categories; physical-phone/assistive-technology certification is not implied. Optional enhancements do not become mandatory just because they appear in the backlog.

Detailed owner actions, developer work, acceptance tests and optional enhancements: [REMAINING_WORK.md](REMAINING_WORK.md).

## 1. Required technology, cost and scope — PDF page 2

- [x] **Supabase database:** dedicated `orbit-task-board` project `ajozwyvyhzrytdhbcttc` exists and currently reports `ACTIVE_HEALTHY`.
- [x] **Supabase authentication:** real anonymous sign-in enabled; verified with independent SDK/browser guest sessions.
- [x] **GitHub version control/code sharing:** source pushed to the private [EverettWuCoding/orbit-task-board repository](https://github.com/EverettWuCoding/orbit-task-board), default branch `main`.
- [x] **Free-tier provisioning choices:** separate nano Supabase project and free/default organization; no paid addon or paid hosting plan selected by the assistant.
- [x] **Free frontend hosting:** public compiled assets on GitHub Pages with the included `github.io` URL; no purchased domain, paid hosting upgrade or expiring anonymous deployment. No paid Supabase addon selected; this is not a claim to have audited unrelated account invoices.
- [x] **Permitted frontend stack:** React + TypeScript web app. React Native and Go are alternatives/options, not additional required implementations.
- [x] **Permitted backend approach:** direct frontend-to-Supabase access with RLS and SQL RPCs; no separate API server is required.
- [ ] **Owner time-limit attestation, if requested:** the PDF gives a 3–6-hour estimate and up-to-12-hour guidance. Human development time was not tracked/independently certified; do not invent a duration in the submission.

Evidence: [package.json](../package.json), [Supabase adapter](../src/lib/supabase.ts), [auth config](../supabase/config.toml), [cloud handoff](CLOUD_HANDOFF.md).

## 2. Design priorities — PDF page 2

- [x] **Cohesive palette:** ink sidebar, cool off-white surfaces, lavender accent and status/urgency cues.
- [x] **Typography system:** system-first font stack, distinct heading/body/metadata hierarchy; no external font dependency.
- [x] **Clear columns/cards:** colored status dots, column titles/counts, bounded task cards, label/priority/date/assignee metadata.
- [x] **Smooth drag interaction:** activation threshold, visual overlay, sortable transitions, drop animation and drop-target feedback.
- [x] **Thoughtful empty states:** empty columns, no filter results, empty member/label rosters, comments/activity and connection state.
- [x] **Loading states:** board skeletons and disabled/busy controls.
- [x] **Error states:** visible connection/mutation errors, retry loading, validation, optimistic rollback and distinction between a failed write and failed refresh after a successful write.
- [x] **Responsive bonus:** four columns on wide screens, two on tablets, stacked phone columns, mobile navigation and adapted dialogs. Prior measured checks at 360/768/1024/1440px found no page overflow.
- [ ] **Owner's final visual review on permanent URL:** subjective design quality cannot be guaranteed by tests. Review normal/empty/error states, content readability, zoom, and an actual phone after deployment.
- [ ] **Actual physical iOS/Android touch-drag check:** implemented touch-safe handles are not the same as tested physical-device gestures. Mobile browser tests cover forms/layout/status changes, not real touch drag.

Evidence: [styles](../src/styles.css), [board](../src/components/Board.tsx), [cards](../src/components/TaskCard.tsx), [desktop screenshot](screenshots/desktop-board.png), [mobile screenshot](screenshots/mobile-board.png). Screenshots are of the deliberate sample/demo workspace, not proof of permanent hosting.

## 3. Required board/frontend — PDF pages 2–3

- [x] Web frontend exists and launches locally.
- [x] Default **To Do** column.
- [x] Default **In Progress** column.
- [x] Default **In Review** column.
- [x] Default **Done** column.
- [x] Users see their board and cards with task metadata.
- [x] Create a task with a required title.
- [x] Optional description input.
- [x] Optional low/normal/high priority selection, with normal default.
- [x] Optional due-date input and clearing.
- [x] Drag tasks across columns to update status.
- [x] Board updates on drop, with optimistic UI and actual persistence.
- [x] Same-column ordering persists, beyond the minimum status-move requirement.
- [x] Loading/error states are clearly represented.
- [x] Additional task edit and confirmed deletion implemented.
- [x] Keyboard dragging and task-detail status alternative implemented and desktop-tested.
- [x] Hosted create/edit/comment/status/delete, actual pointer cross-column move and same-column reorder after reload passed on the actual **HTTPS frontend**. Whitespace append and outside-board cancellation have explicit local regressions.

Evidence: [status model](../src/lib/types.ts), [board](../src/components/Board.tsx), [task editor](../src/components/TaskDialog.tsx), [state hook](../src/hooks/useBoard.ts), [browser workflows](../e2e/board.spec.ts), [keyboard/input checks](../e2e/production.spec.ts).

## 4. Required Supabase task schema — PDF page 3

Each field below was rechecked against the **live** database's information schema during this audit.

- [x] `id`: `uuid`, primary key, generated UUID default.
- [x] `title`: `text`, non-null, rejects blank/oversized titles.
- [x] `status`: `text`, constrained to `todo`, `in_progress`, `in_review`, `done`.
- [x] `user_id`: `uuid`, linked to Auth user, defaults to `auth.uid()`.
- [x] `created_at`: auto-set `timestamptz`/`now()`. Timezone-aware timestamp fulfills the timestamp requirement.
- [x] **Bonus** `description`: `text`.
- [x] **Bonus** `priority`: `text` constrained to low/normal/high.
- [x] **Bonus** `due_date`: nullable `date`.
- [x] **Bonus** `assignee_id`: nullable `uuid` referencing a same-owner team member.
- [x] Actual task persistence in Supabase.
- [x] RLS enabled on tasks; additionally enabled on all five dependent tables.
- [x] Extra `updated_at` and `position` fields support edits/order; no required field substituted away.

Evidence: [full executable SQL](../supabase/migrations/001_initial_schema.sql), [PostgreSQL tests](../tests/database.test.ts), [hosted SDK verification](../scripts/verify-supabase.mjs).

## 5. Required guest accounts and isolation — PDF page 3

- [x] Uses **Supabase Auth anonymous sign-in**, not just a fabricated local ID.
- [x] No email/password required for the app's guest flow.
- [x] Automatic first-launch guest session.
- [x] Existing browser session reused; SDK persistence/token refresh configured.
- [x] Every task belongs to that guest's `user_id`.
- [x] RLS limits guest reads/writes to the owner's records.
- [x] Guest A's task is visible to A, not B.
- [x] Guest B's task is visible to B, not A.
- [x] Actual separate-browser guest behavior verified against the hosted backend through the local app.
- [x] Ownership spoofing, cross-guest edits/deletes and cross-guest member/label/comment links rejected in live SDK checks.
- [x] Unauthenticated database `anon` clients denied table access and mutation RPCs. Anonymous **Auth users** use the authenticated role with owner RLS; these are different concepts.
- [x] Same-guest cross-tab Realtime verified; existing data privacy remains RLS-controlled.
- [x] Repeat independent-guest and same-guest cross-tab tests on the final hosted origin; passed with actual cloud persistence and Realtime.

Limit: clearing browser Auth storage or closing an incognito session can lose access to an anonymous account. Recovery/account upgrades are not implemented and are not required by the PDF.

Evidence: [auth/repository](../src/lib/supabase.ts), [RLS policies](../supabase/migrations/001_initial_schema.sql), [live browser verification](../scripts/verify-cloud-browser.mjs).

## 6. Advanced features — every page-4 bullet

The PDF makes these **optional** and says to pick any combination. All seven categories are present; they are not all unlimited/full-product implementations.

### 6.1 Team members and assignees

- [x] Create a small personal roster by adding member **names**.
- [x] Select a member **color**; render automatic initial avatars.
- [x] Show members in board UI/sidebar, with management available on mobile. First five shown in sidebar; the management dialog exposes the full roster.
- [x] Assign **one** member to a task; select/unassign/change the assignee.
- [x] Display the assignee avatar on task cards.
- [x] Roster persisted in Supabase; same-owner FK; deleting a member safely unassigns rather than deletes tasks.
- [ ] **Multiple simultaneous assignees:** not implemented. There is one `assignee_id` and a single-select control, not a task/member join table.
- [ ] **Uploaded avatar photographs/custom image URL:** not implemented. The optional avatar/color choice is covered by colors and initials; photos are an enhancement, not a required missing feature.

**Interpretation:** the PDF's “one or more” permits one. Mark the minimum assignment capability complete, but do not advertise multi-assignee support. For maximum standout coverage, multiple assignees are the clearest remaining page-4-related enhancement. A roster is not shared authenticated coworker collaboration; invitations/shared accounts are not claimed.

Evidence: [roster dialog](../src/components/ManageDialog.tsx), [single-select assignee](../src/components/TaskDialog.tsx), [card/avatar](../src/components/TaskCard.tsx), [schema](../supabase/migrations/001_initial_schema.sql).

### 6.2 Task comments

- [x] Open a task-detail view and write a comment.
- [x] Display comments chronologically.
- [x] Display timestamps/relative times; exact date/time available via timestamp title.
- [x] Store in separate **Supabase `comments` table**.
- [x] Comments are task-owned, RLS-protected, length-limited and rendered as text; verified persistence.

Limits: no edit/delete comment UI, threaded replies, mentions or separate coworker authors. All comments belong to the single guest and show “You.” None of these extras is requested by the three page-4 comment bullets.

Evidence: [comments panel](../src/components/TaskDialog.tsx), [comments schema](../supabase/migrations/001_initial_schema.sql).

### 6.3 Task activity log

- [x] Track **status changes** with source/destination column names.
- [x] Track **edits** to title, description, priority and due date.
- [x] Track **assignment changes/unassignment**; additionally track label addition/removal.
- [x] Show an activity timeline inside task details.
- [x] Show relative time plus exact timestamp detail, including the requested moved-from/to style.
- [x] Activity generated by database triggers, not user-submitted history; clients cannot insert/update/delete events directly.

Limits: no full old/new text revision diff or authenticated coworker actor identity. Initial task creation records a creation event, not a separate assignment-change event for an assignee already set at creation. Deleting a task removes its history. None is required by the PDF's activity bullets.

Evidence: [activity panel](../src/components/TaskDialog.tsx), [trigger logic](../supabase/migrations/001_initial_schema.sql), [audit/immutability tests](../tests/database.test.ts).

### 6.4 Labels/tags

- [x] Create custom labels with names and colors.
- [x] Assign **multiple** labels to the same task.
- [x] Filter the board by label.
- [x] Labels/task links persist in Supabase and respect owner isolation.
- [x] Removing a label removes links without deleting tasks; duplicate names checked case-insensitively.

Limits: no label rename/recolor UI after creation; palette choices are provided rather than an arbitrary color picker. These are extra editing conveniences, not missing requested create/assign/filter capabilities.

Evidence: [management](../src/components/ManageDialog.tsx), [label checkboxes](../src/components/TaskDialog.tsx), [filters](../src/lib/domain.ts), [many-label schema](../supabase/migrations/001_initial_schema.sql).

### 6.5 Due-date indicators

- [x] Due-soon tasks highlighted **on the card**.
- [x] Overdue tasks highlighted **on the card**.
- [x] Badge color, date label and calendar icon communicate urgency; title exposes full due date/overdue wording.
- [x] Local-calendar comparison avoids UTC date shifts.
- [x] Completed tasks never count as overdue; due-soon threshold is today through the next two days.

Limit: dates/stats and relative times recalculate on render, not from a dedicated clock. A completely idle tab may stay stale across midnight. This is a quality improvement listed in the backlog, not a missing basic indicator implementation.

Evidence: [date rules](../src/lib/domain.ts), [card badges](../src/components/TaskCard.tsx), [date tests](../src/lib/domain.test.ts).

### 6.6 Search and filtering

- [x] Search bar filters **task titles**, case-insensitively.
- [x] Filter by priority.
- [x] Filter by assignee, including unassigned.
- [x] Filter by label.
- [x] Combine search/filters and clear them; also due-soon/overdue navigation and board/list display.

The PDF says priority, assignee **or** label; all three are implemented. Description search, saved filters and multi-select filter values are not required.

Evidence: [toolbar](../src/App.tsx), [filter logic](../src/lib/domain.ts), [filter tests](../src/lib/domain.test.ts), [browser filter test](../e2e/board.spec.ts).

### 6.7 Board summary/stats

- [x] Total tasks displayed.
- [x] Completed tasks displayed.
- [x] Overdue tasks displayed.
- [x] Summary placed in header; additionally completion percentage/progress bar.
- [x] Summary uses the **full board**, not just filtered results; completed tasks excluded from overdue count.

No analytics chart, export or historical metrics is requested.

Evidence: [header summary](../src/App.tsx), [statistics](../src/lib/domain.ts), [statistics tests](../src/lib/domain.test.ts).

## 7. Hosting, access and security — PDF page 5

- [x] Frontend host configuration supplied for Vercel and Netlify; Cloudflare Pages is an alternative, not a third required deployment.
- [x] **Reviewer-accessible live frontend on a free service:** https://everettwucoding.github.io/orbit-task-board-demo/ — enforced HTTPS, public compiled assets, no host login/domain purchase. The PDF lists free hosting examples, not a prohibition on equivalent free static hosting.
- [x] Supply the **verified account-owned live URL** in submission config/generator. Final artifact validation is performed after regeneration.
- [x] GitHub repository exists, private as permitted by the PDF, and contains pushed source.
- [x] Actual repository URL prepared in submission config/document.
- [ ] **Deliver repository URL directly to reviewer** through the specified handoff. No submission has been sent. The PDF says collaborators need not be added; do not assume a private URL changes GitHub's visibility rules. If the actual reviewer cannot open it, resolve access through the assessment's stated process before altering visibility.
- [x] Full SQL schema prepared in final document, including tables, checks, RLS, indexes, triggers, functions and grants.
- [ ] **Actually share the schema/document** with the reviewer through final submission.
- [x] No Supabase service-role/secret key used in the frontend; public anon key only.
- [x] Confidential PDF, local env, private metadata and generated documents excluded from Git and hosting uploads. Current Git-history path audit found none committed.
- [x] No reviewer Supabase membership invitation needed; schema sharing is the chosen supported method.
- [x] Database structure screenshot **not necessary** because full SQL is included; optional only.

Evidence: [working Pages frontend](https://everettwucoding.github.io/orbit-task-board-demo/), [hosting record](CLOUD_HANDOFF.md), [Git ignore](../.gitignore), [upload exclusions](../.vercelignore), [submission config](../submission/submission.config.json), [generated PDF](../submission/everett_wu_task_manager_assessment.pdf).

## 8. Final document and submission — PDF pages 5–6

- [x] Generator creates the named **Everett Wu** PDF/Word deliverables.
- [x] Correct PDF filename: [everett_wu_task_manager_assessment.pdf](../submission/everett_wu_task_manager_assessment.pdf).
- [x] Overview of solution.
- [x] Design decisions.
- [x] Working account-owned HTTPS frontend link supplied to the named final document generator.
- [x] Actual GitHub repository link.
- [x] Full SQL schema. Independently extracted from the generated PDF and checked against the full migration; not just a summary.
- [x] Local setup instructions.
- [x] Advanced features and how they work, including honest single-assignee/guest-roster scope.
- [x] Tradeoffs and future improvements.
- [x] Named PDF and editable Word generation available; no duplicate source assessment needs to be submitted.
- [x] Finalize and regenerate existing named PDF/Word: actual URL, fresh verification, accurate GitHub Pages setup and no obsolete hosting-blocker narrative or DRAFT/PENDING markers; independent content/link/full-SQL checks passed.
- [x] Inspect representative rendered PDF pages and check all text blocks remain within page bounds. SQL and both real hyperlinks are present in PDF and Word; primary PDF has seven pages.
- [ ] Human visual review of the final PDF/Word: link clicks, readable SQL, no clipped pages, correct name, complete contents.
- [ ] Choose **one** PDF or Word document to submit, not both plus source PDF.
- [ ] Upload chosen finished document to Google Drive.
- [ ] Apply the exact Drive sharing permissions specified by the assessment's Google Form instructions.
- [ ] Test the Drive link from a reviewer-like session/account.
- [ ] Paste the Drive document link into the assessment Google Form and complete any additional requested fields.
- [ ] Submit the form and retain confirmation.

The provided PDF does not contain the actual Google Form URL or detailed permission choices. The owner must supply/use the original invitation/form instructions; no form URL or sharing policy should be fabricated.

## 9. Confidentiality — PDF pages 1 and 5–6

- [x] Original assessment PDF remains local and ignored; not in GitHub, public assets or deployment upload.
- [x] Final-document PDFs/Word files and private deployment-claim links not committed/published.
- [x] Repository remains private; no public profile/social promotion performed.
- [ ] At handoff, upload **only the finished solution document**, never the source assessment PDF.
- [ ] Keep the final submission/document link off LinkedIn, public GitHub profile pages, personal sites and other public platforms.
- [x] Resume demo-link inclusion is **permitted, not required**; only use a working demo URL, not the confidential assessment/document link.

## 10. Evaluation readiness — PDF pages 5–6

| Evaluation area | Current position | Remaining action |
| --- | --- | --- |
| Design quality | Custom design and responsive samples implemented; automated checks passed | Owner/reviewer subjective review on actual hosted app; actual phone check |
| Board functionality | CRUD, four columns, pointer/keyboard moves and persistence implemented | Repeat acceptance on hosted origin |
| Usability/state handling | Empty/loading/errors, retry, rollback and confirmed-delete behavior present | Optional polish items and hostile-network manual checks in backlog |
| Schema/persistence | Live schema and guest RLS verified, not merely mocked | Recheck health before review; no recreation needed |
| Security awareness | Public-key-only client, owner checks, private files ignored | Preserve RLS, confirm hosting upload/billing and reviewer access; no token sharing |
| Advanced features | All seven present; single-assignee boundary explicit | Multi-assignee/avatar uploads optional; don't claim missing capabilities |
| Code quality | Strict TS, modular repository/domain structure, tests, two successful CI runs | Optional cleanup/concurrency/accessibility refinements; not full certification |
| Live app execution | **Verified:** free account-owned Pages frontend; real hosted guest/feature/reorder tests passed | Keep Supabase active and review once personally before sharing |
| Final document clarity | Named PDF/Word finalized and independently checked; all seven required contents, no draft markers | Owner personally inspects and privately delivers one document |

## Evidence freshness

- Application-fix commit `8a95f27` has a successful [GitHub Linux CI run](https://github.com/EverettWuCoding/orbit-task-board/actions/runs/41400882418); the [fixed Pages deployment](https://github.com/EverettWuCoding/orbit-task-board-demo/actions/runs/41400943222) also passed.
- Last local full check: lint/build and **48 unit/database/collision tests** passed; **18** use actual PostgreSQL SQL/roles.
- Browser suite: **20 passed**, **4 intentionally skipped** mobile physical-input scenarios, zero local retries; **10 targeted append/reorder/cancel repetitions** passed. Selected-screen axe checks passed; not complete accessibility/device certification.
- Prior live SDK/browser scripts verified real Supabase guest isolation/persistence/Realtime; this audit rechecked live project health, task column definitions and six-table RLS without creating new guest test data.
- The named final PDF/Word is regenerated and checked for author, both real hyperlinks, full SQL, required headings and absence of obsolete DRAFT/PENDING markers before final handoff.
- The historical temporary frontend is unavailable and is not the final demo URL. Use only https://everettwucoding.github.io/orbit-task-board-demo/.

This checklist is an evidence-based snapshot. **Required blocker list and optional development work are separated in [REMAINING_WORK.md](REMAINING_WORK.md).**