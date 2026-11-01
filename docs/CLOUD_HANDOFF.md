# Cloud setup completed and remaining owner action

## Completed

- **GitHub:** https://github.com/EverettWuCoding/orbit-task-board — private repository, `main` branch, source pushed. No assessment PDF, generated Word/PDF, local credentials or service-role key was committed.
- **Supabase:** https://supabase.com/dashboard/project/ajozwyvyhzrytdhbcttc — dedicated `orbit-task-board` nano project in the new `Orbit Assessment` organization. Existing projects were not modified. The new organization/project used the free defaults; no paid addon was selected.
- **Database:** full migration executed; all six tables have RLS; owner-aware foreign keys, transactional saves/moves and trigger-generated history installed; all six tables published for Realtime.
- **Authentication:** anonymous sign-in enabled; the project's original hosted email-confirmation and TOTP security defaults preserved. Current CLI config sync reports all declared services up to date.
- **Frontend connection:** this workspace's ignored local environment file contains only the project URL and public anon key. Local app at http://127.0.0.1:5173 now connects to the real cloud database, not demo storage.
- **Live SDK checks:** independent anonymous guests, restored sessions, private reads/writes, rejected ownership spoofing and cross-guest member/label/comment links, transactional rollback, unforgeable activity, comments, move persistence and Realtime verified.
- **Live browser checks:** separate browser guests, reload persistence, task status/comments/history and same-guest cross-tab Realtime verified. Test task/member/label/comment rows removed afterward. Anonymous test accounts are harmless remaining auth records; no unrelated account/data cleanup was performed.
- **CI:** first GitHub Actions run passed: https://github.com/EverettWuCoding/orbit-task-board/actions/runs/41339845836. Subsequent commits trigger the same pipeline.
- **Documents:** author/repository supplied; generator records backend verification while retaining a DRAFT marker until permanent frontend hosting is usable.

## Blocked: permanently owned free frontend hosting

Neither Vercel nor Netlify was authenticated. A Vercel browser/device login was started but not approved before it expired.

A **temporary** prebuilt deployment was created at https://prompt-aurora-vw4wf1w.tmp.now. Vercel reported an expiry of about 57 minutes at creation. Both the integrated browser and independent HTTP client received **403 Forbidden**, so this is **not a verified reviewer-accessible live app** and must not be treated as the final URL. The private claim page was opened for the owner; its capability-bearing claim link is intentionally **not recorded in source, docs or GitHub**.

### Owner action required

1. In the opened Vercel claim page, sign in/create a free Hobby account directly and claim the deployment before it expires. If it already expired, sign in normally and create a new permanent deployment.
2. Do not share passwords, login codes, private claim URLs, API tokens or admin keys through chat. Complete login/authorization directly in the browser or terminal.
3. Once logged in, the assistant can link the project, add the two public build variables, deploy to production, connect GitHub for continuous deployment and check the actual HTTPS URL. No paid plan/addon should be enabled.
4. The hosted app must be available to a fresh unauthenticated visitor, display **Private workspace**, and pass two-browser guest isolation and persistence checks. Disable account-only deployment protection on the **public demo frontend**, not on Supabase data/RLS.
5. Set Supabase Auth's Site URL to the final HTTPS domain. Keep anonymous sign-in and RLS enabled.
6. Set `liveUrl` and `liveVerified: true` in the submission config only after those checks. Replace the pending deployment notes and regenerate Everett Wu's PDF/Word file.
7. Inspect the final PDF and upload it through the assessment's private Drive/Form process. No Drive/Form submission has been performed because the final link is still blocked.

## Password and key handling

The database password was randomly generated, passed to the CLI without being printed, and was not committed or embedded in the app. The owner can reset the database password in Supabase project settings if direct database access is later needed. No password is required by the frontend or public-key verification scripts. The management CLI's existing authenticated account was used without printing its token.

Supabase security-advisor warnings:

- **Anonymous access policies:** expected for this assessment's required anonymous Auth users. Each policy still checks `auth.uid() = user_id`; unauthenticated public clients and other guests were blocked in actual live tests.
- **Leaked password protection disabled:** the app has no password sign-in flow. No paid feature was enabled to silence this warning.

## Re-run verification

- `npm run verify:supabase` checks the dedicated live backend using its public key and two ephemeral anonymous sessions.
- `npm run verify:cloud-browser` checks the local frontend-to-live-backend path. Pass a verified permanent HTTPS frontend URL as its argument to repeat after hosting.
- `npm run check` runs lint, 42 unit/database tests and the production build.
- Existing local-demo E2E tests require a demo-configured server. Stop a cloud-configured dev server before running them; the CI server explicitly uses demo variables and no production credentials.

The deployment upload ignore files exclude the confidential PDF, local environment files, generated private documents, source database metadata and non-build assets. The prebuilt upload contains only the compiled frontend and security-header config.