# Local and Supabase setup

## 1. Local preview

Install Node.js 22.12+ and run `npm ci`, then `npm run dev` from the project root. The VS Code “Orbit: development server” task provides the same launch. Open http://127.0.0.1:5173.

No credentials are needed for the local demo. It uses a distinct `orbit.demo.v1` storage key and is always labeled “Local demo.” Cloud accounts start empty; example data is never injected into Supabase.

## 2. Create a free Supabase project

1. Sign in at https://supabase.com/dashboard and create a **Free** project.
2. Choose a region near the intended users and store the database password privately. It is not needed by the frontend or this assistant.
3. In **Authentication → Sign In / Providers**, enable **Anonymous Sign-Ins**. Dashboard labels may vary; this is the anonymous auth provider, not the unauthenticated database `anon` role.
4. In the **SQL Editor**, paste and run the entire [migration](../supabase/migrations/001_initial_schema.sql), once, in a new project. It runs as a transaction. If it fails, the transaction does not leave half the schema installed.
5. Check that `tasks`, `team_members`, `labels`, `task_labels`, `comments`, and `task_activity` exist and RLS is enabled on all six.
6. If the `supabase_realtime` publication exists, the migration adds all six tables. Verify them under the database's Realtime/replication settings. The board persists on drop even when Realtime is unavailable.
7. Under project settings / Connect / API keys, copy the **project URL** and **public publishable key** (starting `sb_publishable_`). A legacy public `anon` JWT also works. Never use `service_role` or `sb_secret_` keys.

## 3. Configure the frontend

Create a local environment file from [.env.example](../.env.example) and set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

These two values are public client configuration, not admin credentials. Security comes from RLS and the guest's auth session. Local environment files are excluded from Git. Do not share passwords, service-role keys, access tokens, or database connection strings through chat.

Restart the development server after changing the environment. For a hosted app, set the same values in the host's build environment and trigger a new deployment.

Both values empty means intentional local demo. Only one value present is a visible setup error. A rejected key or a failed cloud connection never silently falls back to demo data.

## 4. Verify required guest behavior

1. Open browser A, confirm “Private workspace” and an initially empty board, and create a task.
2. Reload A: the task and the same guest workspace identifier should remain.
3. Open browser B using a different browser profile or an incognito session. Confirm an empty board and a different guest identifier.
4. Create a task in B. A must not show it, and B must not show A's task.
5. Move A's task into In Progress and refresh. Check the saved status and position in the database.
6. Create members and labels; add comments and change task fields. Confirm comments and server-generated history in task details.
7. Open a second tab of browser A and check Realtime updates. A different guest must never receive A's task contents.
8. Run the adversarial RLS tests in [VERIFICATION.md](VERIFICATION.md) in a disposable project/session before submission.

Do not clear site storage as a routine troubleshooting step. Anonymous accounts have no email/password recovery; clearing auth storage or closing an incognito session can permanently lose access to that guest's tasks.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Local demo still appears | Supply both build variables and restart/redeploy. Check for extra spaces. |
| Guest sign-in disabled | Enable the anonymous auth provider. |
| Missing table/function or schema-cache error | Run the complete migration and allow PostgREST to refresh its schema cache. |
| Could not connect | Check URL, public key, network, allowed browser extensions and the free project's paused state. |
| Auth rate limit | Wait for the project's anonymous-signup limit; don't repeatedly clear storage or create accounts. |
| Guest signup CAPTCHA error | This build does not integrate a CAPTCHA widget. For a public production launch, add Turnstile/hCaptcha and pass `captchaToken` to anonymous sign-in before enabling mandatory CAPTCHA. |
| JWT/session error | Reload to attempt the SDK's session refresh. Clearing storage starts a new guest, not account recovery. |
| Changes save but another tab does not update | Check publication and Realtime settings; refocus/reconnect the tab for an RLS-filtered refresh. |
| “Saved, but refreshing failed” | Retry loading, **do not resubmit**; the write was already confirmed. |
| Corrupted local demo | Use Reset demo if browser storage is available. This only resets local sample data. |

## Security and operational notes

- Anonymous auth users are authenticated users from PostgreSQL's perspective. The policies use `(select auth.uid()) = user_id` for both access and ownership checks.
- Realtime callbacks never write data and always reload through RLS-protected queries. Authentication remains the security boundary, not frontend filters.
- Do not disable RLS to work around a permission error.
- Use free tiers only. Supabase free projects can pause with inactivity; check project health before sending the reviewer a URL.
- A public anonymous signup endpoint can be abused. Platform rate limits are in place, but a real production launch should add CAPTCHA, retention and abandoned-guest cleanup. That operations work is not claimed as implemented here.