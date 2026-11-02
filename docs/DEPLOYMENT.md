# GitHub, free hosting, and assessment handoff

**Primary deployment: https://everett-wu-orbit-task-board.netlify.app/** on **Netlify Free**, exactly one of the assessment's listed services. **Additional fully functioning website: https://everettwucoding.github.io/orbit-task-board-demo/**. Complete source is public after the approved full-history audit. No domain purchase, paid plan or confidential-document upload is involved.

## Current Netlify Free deployment

The owner approved CLI access and explicitly set this site's production visibility to Public; previews stay private. Free plan, no paid trials/payment method and disabled automatic top-ups were checked. Build command `npm run build`, output `dist`, only the two public Supabase build variables required. The completed production upload is manual, not automatic Git deploy. Security headers come from [netlify.toml](../netlify.toml). A new production upload must be followed by fresh-visitor/guest/feature checks. Netlify site ID is `5f00075c-6f4f-4f9a-af7d-8315ab02e2a7`.

## Additional GitHub Pages website

The assets-only repository is https://github.com/EverettWuCoding/orbit-task-board-demo. Pages publishes its `main` branch root over enforced HTTPS. Build the public source with both public Supabase variables and `npm run build -- --base=/orbit-task-board-demo/`; deploy only the output plus `.nojekyll`. Preserve subpath navigation. This is an extra working website, not the primary assessment host. See [CLOUD_HANDOFF.md](CLOUD_HANDOFF.md).

## GitHub

1. Create a free repository in your own account. A private repository is appropriate; the assessment allows sharing its link directly with the reviewer. If you choose public, do not publish the assessment PDF or submission document.
2. Initialize/push this project using VS Code Source Control or Git. Before the first commit, inspect the staged files.
3. Include application source, the npm lockfile, SQL migration, docs, deployment config and tests.
4. Do **not** stage local environment files, the supplied assessment PDF, generated PDF/Word documents, auth credentials, `.venv`, dependency directories or test artifacts. [.gitignore](../.gitignore) excludes them.
5. Do not post your final submission link on public profiles or social media. Share it only via the requested assessment process.

The included CI workflow runs lint, unit/PostgreSQL tests, the production build, and Chromium desktop/mobile tests on a free GitHub runner. A private repository's available Actions minutes depend on the free account allowance; no paid runner is required.

## Vercel Hobby (free)

1. Finish [Supabase setup](SETUP.md) first.
2. Sign in at https://vercel.com and import your GitHub repository as a Vite project.
3. Choose the free/Hobby option and Node 24 if available, otherwise a supported Node 22.12+ runtime.
4. Build command: `npm run build`. Output directory: `dist`. Install command: `npm ci`.
5. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the production build environment. Never add a service-role key.
6. Deploy; inspect the build logs and open the resulting HTTPS URL. Confirm **Private workspace**, not **Local demo**.
7. Add the hosted URL to Supabase Auth's Site URL / allowed URLs as appropriate for your project configuration. This build does not use an auth redirect, but the settings should reflect the actual deployment.
8. Run the two-browser live acceptance checklist before including the URL in your submission.

[vercel.json](../vercel.json) defines the build output and security headers. The app is a single-page, root-route workspace and does not need catch-all routing.

## Netlify Git import (optional future automation)

Import the repository at https://netlify.com. Set the same environment variables, Node runtime, install/build settings and output directory. [netlify.toml](../netlify.toml) supplies the build config and security headers. Confirm the plan is free and validate anonymous guest persistence on the actual deployed HTTPS domain.

## Deployment safety

- Build configuration is public client data. RLS must be enabled before any live signup.
- A compiled Vite bundle cannot pick up runtime environment changes; redeploy after editing variables.
- Moving between localhost and a hosted domain creates separate browser auth storage/session scopes.
- Supabase free projects may pause when inactive. Recheck health and resume a paused project before review.
- If any public frontend build accidentally includes an admin/secret key, **rotate it immediately** and redeploy. The runtime's key checks are a guardrail, not protection for a secret already embedded in an uploaded bundle.

## Generate the final document

Edit [submission/submission.config.json](../submission/submission.config.json) with your first/last name, actual live URL, actual GitHub URL and `liveVerified: true` **only after performing the live checks**. Run `npm run submission`.

The generator creates both `firstname_lastname_task_manager_assessment.pdf` and an editable `.docx` using your supplied names. It includes:

- solution overview and design decisions;
- clickable live frontend and GitHub links;
- the full executable SQL schema;
- local setup and Supabase configuration;
- advanced features and how they work;
- testing scope, tradeoffs and future improvements.

Until those values are supplied and live verification is confirmed, output is prominently marked **DRAFT** with pending links. Do not submit a draft as a deployed solution. Generated files remain ignored by Git.

Open and inspect the generated PDF. Upload just the finished requested document to Google Drive and follow the Google Form's sharing instructions. Do not upload the confidential assessment PDF or publicly distribute the submission link.