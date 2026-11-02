# Exhaustive remaining work: owner actions vs implementation

**Updated November 2, 2026.** Owner approved assessment/handoff concerns only, public source after full-history audit and Netlify Free. No optional feature/reliability backlog expansion was authorized in this step.

Full checked requirement matrix: [REQUIREMENTS.md](REQUIREMENTS.md).

## Executive answer

**The mandatory application and all seven advanced categories are implemented and verified on the live HTTPS site. The reorder notification is fixed: local tests and Linux CI pass, and the repaired app is redeployed.**

Completed: primary [Netlify Free frontend](https://everett-wu-orbit-task-board.netlify.app/) on an explicitly named host, additional [fully functioning Pages website](https://everettwucoding.github.io/orbit-task-board-demo/), publicly readable/clonable full source after audit, real hosted guest isolation and all seven advanced categories/pointer/reload checks on both sites. Netlify Free/no trial/no payment method/top-ups disabled verified; production made public by owner, previews kept private.

**Remaining required owner steps:** personally inspect the live app/document, upload **one** finished file to Drive, apply the actual invitation's permissions, submit its Google Form and retain confirmation. No submission has been sent. The old temporary Vercel site is historical/unusable; no Vercel login/domain purchase is needed now.

## A. Required actions only the owner can authorize/complete

### A1. Free hosting — completed

- [x] Owner authorized Netlify Free; primary site deployed and public production verified, resolving the listed-host concern.
- [x] Full source public with owner approval after complete historical audit; confidential PDF/private handoff documents stay local/ignored. Separate Pages repository contains compiled assets only.
- [x] HTTPS site is account-owned, built and reviewer-accessible without host login; no custom domain or paid hosting addon selected.
- [x] Supabase Site URL updated and actual hosted guest/feature/pointer persistence verified.
- [x] Old temporary claim/login is no longer needed. Never share credentials or private claim links if managing any service later.

### A2. Reviewer/invitation details

- [ ] Locate the **actual Google Form URL** and invitation-specific instructions. The PDF itself does not provide that URL.
- [ ] Determine the exact Google Drive sharing policy required by that form: permission level, reviewer email if specified, or permitted link-access setting. Do not invent an address or make documents publicly searchable.
- [ ] Confirm your submission identity/name. `Everett Wu` is already filled from verified Git identity; change only if the application requires a different legal/preferred name.
- [ ] Confirm any deadline/additional form fields from the invitation. No deadline or extra questions beyond the PDF can be inferred.
- [ ] If asked to state time spent, supply an honest human-time estimate; the repository does not track/certify it.

### A3. Final human review and private delivery

- [ ] Personally open the **permanent live app** and try the feature walkthrough in section C. This ensures the submitted work can be explained and demonstrated; tests do not replace your review.
- [ ] Open the final named PDF or Word file, click the live/repository links, check formatting and ensure all claims match the actual app.
- [ ] Choose **one final document**. The named PDF is already the straightforward format; having a Word draft does not require submitting both.
- [ ] Upload the chosen final document to your Google Drive. Google login/permission consent must happen directly in your account; the assistant can help navigate once access is available.
- [ ] Set exactly the reviewer-readable permissions requested by the form, without allowing editing unless explicitly requested.
- [ ] Test the Drive link with a fresh/reviewer-like session so the recipient can read/download the document without using your account.
- [x] Resolve source reviewer access: actual complete-source URL is public and anonymous HTTP200 verified. Include it in final document; actual Form delivery remains open.
- [ ] Complete the Google Form with the Drive document link and all invitation-required fields; perform the final submission/consent in your own account and save confirmation.
- [ ] Never upload the original confidential assessment PDF. Keep the final submission link off public profiles, social media and personal websites.

## B. Technical completion — verified or finalized in this handoff

| Priority / open item | Owner dependency | Completion condition |
| --- | --- | --- |
| [x] Create/link account-owned named host | Owner Netlify authorization | Netlify Free, no paid trial/top-up, public production and private previews |
| [x] Deploy audited built assets | Host access | Successful fixed app deployment, no confidential PDF/document/env metadata |
| [x] Configure public Supabase build variables | Build environment | Correct project URL/public key, no service-role credential |
| [x] Verify public HTTPS frontend | Live URL | Fresh visitors load Orbit and real guest sessions, no host login |
| [x] Preserve RLS and accessible demo | Site/database settings | Frontend public; data remains owner-private |
| [x] Record canonical and additional website URLs | Successful deployment | Netlify primary; GitHub Pages additional functioning website |
| [x] Update Supabase Site URL | Final domain | Declared hosted origin with localhost redirects retained |
| [x] Repeat hosted automated acceptance | Live URL | Guests, all seven advanced categories, pointer append/reorder/reload and Realtime passed |
| [x] Set live URL/verification config | Hosted checks passed | Actual checks completed, not only CLI “Ready” |
| [x] Update document source/checklists | Verified results | Actual hosting, test counts and honest scope included |
| [x] Final named PDF/Word generation configured | Existing files | Live/source URLs, full SQL, setup/features/tradeoffs, no draft markers when verified |
| [ ] Owner final visual inspection | Finished artifact | Open and check readable SQL, hyperlinks/name and reviewer access before uploading |
| [x] Push application fix and verify Linux CI | Existing GitHub auth | Application fix CI and compiled Pages deployment both succeeded; final document-source push follows validation |

**Useful but not required by the PDF:** connect host-to-GitHub automatic production redeployment. The repository CI verifies code but is not itself a frontend deployment pipeline. Prefer enabling auto-deploy once correct public build variables and protection settings are established; do not describe it as already connected.

**Windows deployment caveat:** Vercel's earlier local build wrapper failed `spawn cmd.exe ENOENT`; ordinary npm/Vite build succeeded. An audited Build Output API static upload worked technically, but the temporary URL was unusable. Use the account host's Git-based build or the validated prebuilt path; don't upload the whole workspace to work around it. `.vercel` generated assets are excluded from lint and Git.

## C. Hosted acceptance record and optional manual review

The actual HTTPS frontend passed independent guest and advanced-feature browser checks after the deployed fix. Checked items below have automated evidence; unchecked items are remaining manual/device review or optional stronger checks, not unimplemented mandatory features.

### C1. Public loading and guest flow

- [x] Fresh visitor reaches Orbit without host-account login; prior hosted smoke found no page/asset errors.
- [x] App reports **Private workspace**, not **Local demo**.
- [x] Browser A creates a real anonymous guest without email/password.
- [x] A creates a task and retains it/identity after reload.
- [x] Independent browser B has a separate guest and does not see A's tasks.
- [x] B creates its task; A does not see B's task.
- [x] Same-browser second tab sees the same guest's data and receives updates.
- [ ] Owner understands that clearing Auth storage or closing incognito loses guest access; do not promise account recovery.

### C2. Core board / required persistence

- [x] All four default columns are present.
- [ ] Create title-only task; validate blank title; add/edit description, priority and due date.
- [x] Actual hosted pointer cross-column move and whitespace append persist after refresh.
- [x] Actual hosted same-column reorder persists after refresh.
- [x] Hosted edit/save/comment/confirmed delete passed; local dialog cancel is covered separately.
- [ ] Clear a due date, remove a label and unassign a member without deleting the task.
- [ ] Keyboard pickup/drop and the status-select alternative work.
- [ ] Temporarily block connectivity and verify clear errors, preserved edits and move rollback/retry. Do not use real service configuration changes to simulate failure.
- [ ] Task loads/saves never reveal another guest's data.

### C3. All seven advanced categories

- [x] **Team:** actual hosted member creation/color/assignment/avatar and persisted roster tested; safe removal cleanup passed. Single-assignee scope explicit.
- [x] **Comments:** hosted write/timestamped chronological UI and reload persistence tested; separate Supabase table/RLS checked.
- [x] **Activity:** status/assignment/priority timeline verified in hosted UI; title/description/date/label event generation covered by actual SQL tests.
- [x] **Labels:** two hosted labels assigned to one task, both chips persisted, combined label filter tested; safe removal tested/cleaned up.
- [x] **Dates:** hosted overdue, today/soon and completed badges and overdue counts tested; later/date-boundary rules covered by domain tests.
- [x] **Filters:** hosted combined case-insensitive title + priority + member + label, empty results and clear checked; list view tested in local full browser suite.
- [x] **Stats:** hosted total/completed/overdue update and full-board summary tested; filtered-summary rule also covered by domain/UI logic.

### C4. Usability, device and availability review

- [ ] Visually review both a **fresh empty cloud workspace** and a populated workspace. The sample screenshots don't represent seeded cloud data; cloud guests currently start empty by design.
- [ ] Check on an actual phone: scroll, grip drag, taps, native selects/date input, comment editor, keyboard viewport and dialog scroll. Automated mobile emulation is not physical gesture proof.
- [ ] Check keyboard focus, dialog escape/return, tab controls, browser zoom and reduced motion. Selected-screen axe checks are not full screen-reader certification.
- [ ] Repeat in a fresh session with the system/date timezone you use; sanity-check calendar-day badge meanings.
- [ ] Check the free Supabase project is active before sending and before the review date. Free-tier inactivity pausing can break an otherwise correct demo.
- [ ] Confirm no mandatory CAPTCHA/provider setting is enabled without matching frontend integration; anonymous sign-in must work for reviewers.
- [ ] Confirm permanent hosting account/billing remains free and available long enough for review.

## D. Features remaining to implement — strict PDF requirements

### D1. Mandatory board/backend/frontend feature gaps

**None identified at this audit.** Required task CRUD/create/move/display, four statuses, loading/error states, Supabase task fields, anonymous guest accounts, persistence and owner RLS are implemented. Do not turn optional production improvements into blockers for the minimum required board.

Live hosting and automated hosted verification are now complete. Mandatory private **Drive/Form delivery** remains an owner action even though the app/document are prepared.

### D2. Page-4 scope not implemented

| Not implemented | PDF status / impact | What implementation would involve |
| --- | --- | --- |
| [ ] **Multiple simultaneous assignees** | “One or more” minimum covered by one; best direct enhancement if wanting fullest interpretation of the standout section | Owner-aware `task_assignees` join table/RLS/FKs, multi-select UI, stacked avatars, filter/history updates, atomic saves and migration/tests. Preserve existing single-assignee data during migration |
| [ ] **Uploaded avatar/photo or custom image URL** | Avatar/color is optional; colored initials already satisfy a supported option | File validation, private/appropriately scoped Supabase Storage policies, upload/delete lifecycle and image fallback. No public arbitrary uploads or service-role key in browser |

These are the only explicitly mentioned page-4 variants beyond the implemented scope. The other six advanced categories have their actual create/display/persist/filter/indicator/stat bullets implemented. The PDF does **not** require shared coworker logins/invitations, threaded comments, edit history diffs, analytics charts or multiple boards.

## E. Concrete quality refinements found in code — optional development backlog

These were identified through source inspection, not asserted as already failing a broad test suite. No feature code was changed during the audit. Prioritize hosted delivery first; implement selected improvements only if useful/within the assessment budget.

| Priority | Open refinement and evidence | Why it matters / suggested acceptance |
| --- | --- | --- |
| P1 polish | [ ] **Dirty-form protection:** [TaskDialog](../src/components/TaskDialog.tsx) closes on cancel/backdrop/Escape through [Modal](../src/components/Primitives.tsx), without comparing drafts to saved task/comment state | Warn before losing substantial unsaved edits/comments; clean dialogs still close immediately; browser keyboard/backdrop tests |
| P1 polish | [ ] **Clock-driven date/time refresh:** [domain date/stats helpers](../src/lib/domain.ts), [App summary](../src/App.tsx) and [relative-time panel](../src/components/TaskDialog.tsx) recalculate on render, with no clock tick | Refresh relative times periodically and due badges/stats at local midnight or visibility change; fake-clock/timezone tests |
| P1 accessibility | [ ] **Complete ARIA tab keyboard behavior:** [detail tablist](../src/components/TaskDialog.tsx) uses tab roles but no arrow/Home/End navigation or roving `tabIndex` | Both tabs already operable by Tab+Enter/click; improve to standard tab pattern, focusable panel as appropriate, explicit tests and manual AT checks |
| P1 state polish | [ ] **Clear stale transient errors after successful background refresh:** [useBoard.refresh](../src/hooks/useBoard.ts) updates data but does not clear an earlier error | Recovering/refocusing must not leave a resolved connectivity error visible; keep confirmed-write/failed-refresh warnings until the needed recovery completes |
| P2 reliability | [ ] **Cross-tab edit conflict protection:** [TaskDialog draft](../src/components/TaskDialog.tsx) initializes once; [save RPC](../supabase/migrations/001_initial_schema.sql) has no expected-version check | Tab A's stale draft can overwrite tab B's newer fields; use expected version/updated-at guard, conflict prompt and retry; per-tab mutation lock is already implemented |
| P2 reliability | [ ] **Ambiguous network-write recovery/idempotency:** [mutation hook](../src/hooks/useBoard.ts) distinguishes acknowledged writes vs refresh failures, not every lost-response-after-commit case | Read back/reconcile after an ambiguous result; stable operation IDs for creations/comments if implemented; don't promise universal exactly-once behavior |
| P2 state polish | [ ] **Keep removed filter targets coherent:** [App filter state](../src/App.tsx) stores member/label IDs independently from updated roster | Deleting a currently selected label/member can leave an empty board with a stale select value until Clear filters; reset invalid IDs or show an explicit removed-target chip |
| P2 state polish | [ ] **Handle a task disappearing while its detail dialog is open:** [selection/render condition](../src/App.tsx) hides missing tasks but keeps selection state | Show that another tab deleted the task, clear selection, restore sensible focus and preserve/read-only unsaved draft if appropriate |
| P2 observability | [ ] **Realtime subscription state UI:** [subscribe](../src/lib/supabase.ts) starts the channel without surfacing error/reconnect status | On-drop persistence is already sufficient for PDF; optionally distinguish connected/reconnecting/offline from the generic private-workspace badge |
| P2 accessibility | [ ] **Broader automated/manual accessibility coverage:** [axe tests](../e2e/accessibility.spec.ts) cover board, task creation, quick guide, not every populated detail/management/list/error state | Audit edit/comments/activity, roster/labels, deletion prompts, filters, list and mobile navigation; verify NVDA/VoiceOver rather than claim certification |
| P2 maintainability | [ ] **Expand dense JSX and add stronger generated database typing:** [App](../src/App.tsx), dialogs and [Supabase adapter](../src/lib/supabase.ts) contain long JSX lines/untyped query result casts | Improve readability and SDK compile-time checks without replacing working behavior or adding unneeded frameworks |
| P3 convenience | [ ] **Edit existing roster members or labels:** [management dialog](../src/components/ManageDialog.tsx) only offers add/remove | Rename/recolor while preserving IDs, assignments/links/history; not required by create-only PDF bullets |
| P3 convenience | [ ] **Comment editing/removal/threading/mentions** | Not requested; current single-guest chronological comments fulfill the requirement. Add only with owner RLS and clear history semantics |
| P3 audit depth | [ ] **Full before/after revisions and initial assignment event detail** | Current server history records field-change summaries; full revision diffs/initial assignee capture are richer optional audit data |

## F. Production hardening not demanded by the assessment

Keep these separate from the required $0 submission path:

- [ ] CAPTCHA integration if opening anonymous signup to unrestricted public traffic: add an actual widget + `captchaToken` flow before enabling mandatory CAPTCHA. Owner-only config toggling would break the current frontend.
- [ ] Retention and cleanup for abandoned guests/test accounts, plus usage/rate monitoring. Current live test scripts remove their application rows but do not use an admin API to delete Auth users.
- [ ] Account upgrade/recovery for long-lived guest work. Not needed for anonymous assessment accounts; requires explicit opt-in, not forced signup.
- [ ] Shared team workspaces/invitations/roles. This is a different authorization model; roster records are not authenticated coworkers.
- [ ] Large-board virtualization/incremental realtime updates/versioning. Reads are paginated but the app refreshes whole owned snapshots; no large-scale performance benchmark is claimed.
- [ ] Archive/undo, multiple projects/boards, saved views, exports or notifications. None appears as a mandatory or advanced bullet in the PDF; do not prioritize over a working demo.
- [ ] Free-host security-header/CSP review appropriate to actual Supabase endpoints; a safe policy must not break Auth/Realtime. Existing security headers are present.

Do not disable required guest RLS or upgrade to paid services just to silence advisory warnings. Anonymous-policy advisor warnings are expected for owner-scoped anonymous Auth. Leaked-password protection warnings concern password Auth, which this app does not expose.

## G. Things you do not need to redo or add

- [x] Complete source GitHub repository pushed and now public with owner approval after historical audit; reviewer read/clone access resolved.
- [x] Dedicated Supabase project already created, healthy, connected; all required fields and RLS verified.
- [x] No need to provide a Supabase service-role key, database password or access token to the frontend/assistant.
- [x] No need to add Go or React Native; React/TypeScript web frontend is an allowed choice.
- [x] No need to create a separate REST backend; direct Supabase is explicitly allowed.
- [x] No need to invite reviewers to your Supabase project; full SQL in the document is the chosen sharing route.
- [x] No schema screenshot is required when the full SQL is present.
- [x] No need to implement all hypothetical production features or extras in E–F to meet the PDF.
- [x] No need to regenerate the database by rerunning the initial migration into the existing project; it already contains the tables. Add a new migration only when intentionally changing features.
- [x] No need to publicly post the assessment or final submission link; doing so conflicts with the confidentiality instruction.

## Recommended order

1. **Completed:** primary Netlify Free deployment, owner-approved public production, correct build variables/auth origin, public complete source, all-category hosted acceptance on both Netlify and the additional Pages site.
2. **Completed in this handoff:** update final document source with verified URL/results, regenerate and validate existing named artifacts; keep private files excluded.
3. **Owner:** personally review hosted features and final PDF. Extra multi-assignee/production polish is optional, not a prerequisite to handoff.
4. **Owner:** privately upload **one** final document, test the exact invitation's Drive permissions, submit the actual Form and save confirmation.

**Do not mark hosting, live verification, final document delivery or form submission complete until the corresponding action has actually happened.**