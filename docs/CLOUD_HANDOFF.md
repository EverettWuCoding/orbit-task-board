# Verified live app and submission handoff

## Working URLs and completed setup

- **Primary live frontend:** https://everett-wu-orbit-task-board.netlify.app/ — account-owned **Netlify Free**, explicitly listed in the assessment. Team plan `credit-free` verified, 300 included credits, no Pro/Enterprise trial, no payment method, automatic top-ups disabled. No custom domain purchased. Production is public; previews retain team-login protection.
- **Additional fully functioning website:** https://everettwucoding.github.io/orbit-task-board-demo/ — retained GitHub Pages demo, not a substitute for the primary listed host. Browser-held guest sessions are separate across these two origins.
- **Full source:** https://github.com/EverettWuCoding/orbit-task-board — now **public** with owner approval, after scanning all 6 existing commits and 83 unique historical blobs for confidential paths/private credential patterns and service-role JWTs; zero findings. Anonymous HTTP200/read/clone access resolves reviewer access. Confidential assessment, generated handoff documents and local credentials remain excluded.
- **Assets-only host:** https://github.com/EverettWuCoding/orbit-task-board-demo — public `.nojekyll`, HTML, favicon and compiled JS/CSS only. No assessment PDF, submission document/link, private environment file, SQL source or privileged key.
- **Supabase:** https://supabase.com/dashboard/project/ajozwyvyhzrytdhbcttc — dedicated nano project in the separate `Orbit Assessment` organization. Existing projects unchanged; no paid addon selected.
- **Database/auth:** six owner-RLS tables, required task fields, same-owner foreign keys, atomic save/move RPCs and server history; anonymous Auth and Realtime enabled. Site URL is Netlify; the additional Pages demo and localhost remain allowed. No application schema or optional feature expansion was needed.
- **Hosted acceptance:** independent guests, session/reload persistence, all seven advanced categories, saved comments/history, combined filters, urgency/stats, actual cross-column pointer moves, column-whitespace appends, persisted same-column reorder and same-guest cross-tab Realtime passed. Temporary application rows removed; test Auth identities may remain.

## Failure notification: fixed and independently verified

The original CI pointer test measured a grip outside a 720px viewport and selected page text instead of picking up the task. The repaired test scrolls/centers the full gesture, checks real pickup/announcements and keeps the original strict order/reload assertions. Demo tests now have their own port 5180 server, separate from the cloud dev app.

Extended hosted coverage also found a genuine append-area issue: generic nearest-corner detection could target a nearby card instead of blank column space. Pointer hit testing now prefers the card actually under the pointer, otherwise its column; outside-board releases cancel. Keyboard geometry navigation is preserved. Six direct collision regressions and explicit append/outside-board browser checks cover this fix.

- Application-fix Linux CI: https://github.com/EverettWuCoding/orbit-task-board/actions/runs/41400882418 — **success**.
- Updated compiled Pages deployment: https://github.com/EverettWuCoding/orbit-task-board-demo/actions/runs/41400943222 — **success**.
- Local checks: **48 unit/database passed; 20 browser passed; 4 intentional mobile physical-input skips; 10 targeted append/reorder/cancel repetitions passed without retries; production smoke passed; audit 0 known vulnerabilities**.

### November 2 Netlify handoff verification

- Site `5f00075c-6f4f-4f9a-af7d-8315ab02e2a7`, production deploy `6ae8d8cba9883f37baa44571`, state **ready**, no deploy expiry.
- Owner completed Netlify authorization and explicitly made production public. Fresh browser/HTTP requests now reach Orbit, not the initial default private-project login gate. Site-login scope is `non_production`; unrelated team defaults and Supabase RLS were not changed.
- All seven advanced categories and actual pointer cross-column/append/reorder/reload workflows passed on **both** Netlify and Pages; independent guests, comments/activity and same-guest realtime verified. Temporary application records removed.
- The full 48-test suite passed serially; all 20 browser scenarios passed with 4 explicit mobile skips, one worker, zero retries and `--timeout=90000`. Initial local parallel worker/30-second runs timed out; no assertions were removed and no application behavior changed to hide them. A separate optional headless-shell smoke failed to launch its browser on this machine; it is not counted as a pass. Existing local axe workflow tests passed on the completed rerun.
- Lint and production build passed; runtime/development dependency audit found 0 known vulnerabilities. Netlify serves the configured `nosniff`, frame denial, referrer and permissions headers. No paid upgrade/addon selected.

## Deployment maintenance

**Primary Netlify:** build with both public Supabase variables and `npm run build`; publish only `dist` using the linked Netlify site and supplied [netlify.toml](../netlify.toml). This handoff used an audited manual CLI production upload (`--no-build` only after a successful local build). No automatic source-to-Netlify deploy integration is claimed. Preserve public **production** access and Free plan/disabled top-ups; do not make previews public unnecessarily.

**Additional Pages demo:** build with `npm run build -- --base=/orbit-task-board-demo/`, copy only built assets plus `.nojekyll` to its separate public repository and push. The two builds have different base paths and must not be interchanged. No source-to-assets automatic publication is claimed.

The earlier anonymous Vercel attempt is historical and unusable. Do not put its temporary URL or private claim link in the final document. The new primary URL is Netlify; Pages is an optional additional functioning website.

## Remaining owner handoff

1. Personally open the live app and named generated PDF; confirm the name, links, feature descriptions, readable SQL and intended review access.
2. Select **one** final PDF or Word document. The named PDF is the primary option.
3. Use the actual invitation's Google Form and Drive-sharing instructions. Their URL/permission specifics are not in the assessment PDF and must not be invented.
4. Upload the finished solution document only, grant the requested reviewer-readable permissions, test the Drive link and submit the Form. Preserve confirmation. No Drive/Form submission has been performed.
5. Keep the assessment PDF and final document/submission link off public profiles/social sites. Sharing the working demo and public compiled website is distinct from publishing the private submission document.

The existing named PDF/Word files are regenerated with live URL, full SQL, setup, all seven advanced categories and tradeoffs. There is no pending hosting feature or required board implementation gap; final private delivery and the owner's human review remain.

## Limits to keep explicit

- One assignee per task (covers the PDF's one-or-more minimum), colored initial avatars, personal roster rather than authenticated shared coworkers. No uploaded photo, multi-assignee, account recovery or invitations are claimed.
- Automated mobile layout/form and keyboard/mouse checks are not a physical iOS/Android gesture or comprehensive screen-reader certification.
- Free Supabase projects can pause with inactivity. Check health before review; do not clear a guest's browser Auth storage unless intentionally abandoning access.
- Keep RLS enabled. Anonymous-policy advisor warnings are expected for required owner-scoped anonymous Auth; unused password protection is not a reason to buy paid features.
- Database passwords, management/access tokens, service-role keys and claim links are not needed by the frontend and must never be published. The public anon key is intentionally browser-visible and protected by RLS.