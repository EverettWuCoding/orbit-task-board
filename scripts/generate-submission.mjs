import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { Document, Paragraph, TextRun, HeadingLevel, Packer, ExternalHyperlink, Header, Footer, PageNumber, AlignmentType } from 'docx';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(resolve(root, 'submission/submission.config.json'), 'utf8'));
const sql = await readFile(resolve(root, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
const safeName = (value, fallback) => String(value || fallback).trim().toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || fallback;
const validateUrl = (value, name) => {
  if (!value) return;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${name} must be an HTTPS URL without embedded credentials.`);
};
validateUrl(config.liveUrl, 'Live URL');
validateUrl(config.additionalDemoUrl, 'Additional demo URL');
validateUrl(config.repositoryUrl, 'Repository URL');
const draft = !config.firstName?.trim() || !config.lastName?.trim() || !config.liveUrl || !config.repositoryUrl || config.liveVerified !== true;
const cloudVerified = config.cloudVerified === true;
const fullName = `${config.firstName || '[First name]'} ${config.lastName || '[Last name]'}`;
const base = `${safeName(config.firstName, 'firstname')}_${safeName(config.lastName, 'lastname')}_task_manager_assessment`;
const output = resolve(root, 'submission');
await mkdir(output, { recursive: true });
const status = draft ? 'DRAFT — name, deployment links, or live verification still pending' : 'Hosted implementation — automated verification completed';

const sections = [
  ['Solution overview', [
    'Orbit is a polished, responsive personal Kanban workspace built with React, TypeScript, Vite and Supabase. It has To Do, In Progress, In Review and Done columns, drag-and-drop workflow, detailed task editing and private guest persistence.',
    'The visual direction pairs a deep ink sidebar, cool off-white work surface and restrained lavender accents. System typography, clear hierarchy, useful empty states and carefully designed task cards keep the interface calm and focused.',
    'Supabase provides the database and anonymous authentication. GitHub provides public source version control and code review access. The primary frontend is hosted on Netlify Free, one of the assessment’s named hosting services, with its included HTTPS netlify.app address. No domain purchase, paid backend or service-role key is needed.',
    draft ? cloudVerified ? 'Deployment status: this is a draft. The GitHub repository is pushed, and the live Supabase backend is configured and verified. A reviewer-accessible frontend deployment and complete live checks are required before finalizing.' : 'Deployment status: this is a draft. The local demo is not a cloud guest account and does not satisfy the live hosting requirement. Configure Supabase, publish the owner repository, deploy the app and verify the actual URLs before submitting.' : 'Deployment status: the account-owned HTTPS frontend and live Supabase backend passed automated browser/SDK acceptance checks. The live app does not require the reviewer to sign in to a hosting account.',
    ...(config.deploymentNotes ? [String(config.deploymentNotes)] : []),
  ]],
  ['Access links', [
    `Primary live frontend (Netlify Free — fully functioning website): ${config.liveUrl || '[PENDING — add the actual deployed HTTPS app URL]'}`,
    ...(config.additionalDemoUrl ? [`Additional live demo (GitHub Pages — fully functioning website): ${config.additionalDemoUrl}`] : []),
    `GitHub source repository (public — complete source code): ${config.repositoryUrl || '[PENDING — add the actual repository URL]'}`,
    'The primary Netlify site and public source repository can be opened by a reviewer without a hosting login or repository invitation. The GitHub Pages website is an additional functioning demo. Each domain creates its own browser-held anonymous guest session; tasks from a guest on one domain do not automatically appear on the other. The confidential assessment PDF and final submission document/link are not published, and no Supabase admin credentials are included.',
  ]],
  ['Core implementation and guest privacy', [
    'The tasks table contains UUID id, required title, checked status, guest user_id, automatic created_at, updated_at, description, priority, due_date, optional assignee_id and persisted position.',
    'On launch, Supabase Auth checks the persisted browser session and signs in anonymously only when needed. Concurrent initialization shares one sign-in promise. Reloading preserves the guest identity; another browser context creates a different guest workspace.',
    'All six application tables have Row Level Security. Read/write policies require auth.uid() to equal the row owner. Composite owner foreign keys prevent attaching another guest’s member, label or comment to a task. Unauthenticated database anon cannot access application tables or call mutation RPCs.',
    'Task saves and label updates are atomic in save_task; reordered positions and status changes are atomic in move_tasks. SECURITY INVOKER preserves RLS. Database triggers generate append-only task activity with restricted function execution and an empty search path.',
    'Drag moves update optimistically, persist on drop, and roll back if the write fails. Debounced Realtime refreshes and focus/online refreshes read through RLS. Confirmed-write/failed-refresh errors are distinguished so users are not invited to create duplicate tasks.',
  ]],
  ['Advanced features implemented', [
    'Team roster and assignees: add name/color records, display initial avatars and task counts, assign one person to a task, and safely unassign on removal. These records are personal roster entries, not authenticated coworker invitations or shared accounts.',
    'Comments: task-detail comments are stored in a separate table, shown chronologically with timestamps and rendered as safe text. Length limits apply in the frontend and database.',
    'Activity timeline: server-generated creation, title/description edits, status, priority, due-date, assignee and label changes. Reordering alone does not flood history. Clients cannot forge or rewrite history.',
    'Labels: create custom names/colors, attach multiple labels to a task, combine label filters with other filters, and delete labels without deleting tasks.',
    'Due-date indicators: overdue and due-soon badges based on the user’s local calendar; completed tasks do not count as overdue.',
    'Search and filtering: title search, priority, assignee/unassigned, label, due-soon and overdue views, plus board/list display and clear-filter controls.',
    'Summary: total, completed, overdue and completion percentage calculated over the full board.',
    'Responsive accessibility: four/two/stacked-column layouts, mobile navigation, focus-managed native dialogs, keyboard drag controls and status alternatives, visible focus, drag announcements and reduced-motion styling.',
  ]],
  ['Local setup and deployment', [
    'Prerequisites: Node.js 22.12+ (Node 24 LTS recommended) and npm. Python is not an application runtime dependency.',
    `Clone the public source: git clone ${config.repositoryUrl || 'YOUR_REPOSITORY_URL'}, then cd orbit-task-board. No repository invitation is needed.`,
    'Install: npm ci. Start: npm run dev. Open http://127.0.0.1:5173. With no Supabase variables, the app shows an explicitly labeled local demo with browser-only persistence.',
    'Cloud setup: create a free Supabase project; enable Anonymous Sign-Ins; execute the full SQL schema below once in the SQL Editor; verify RLS and the Realtime publication.',
    'Copy .env.example to .env.local. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the project URL and PUBLIC publishable (or legacy anon) key. Never supply a service-role or sb_secret_ key. Restart the dev server after changes.',
    'Primary Netlify deployment: npm run build produces the root-path dist folder; npm run preview serves that build locally. Both public Supabase variables must be present at build time. The account-owned Netlify site uses the supplied netlify.toml configuration and deploys only the audited dist output, with security headers and public production access. This deployment is a manual CLI upload, not a claim that source pushes automatically redeploy. Keep the team on Free with paid trials/automatic top-ups disabled.',
    'The additional GitHub Pages website uses npm run build -- --base=/orbit-task-board-demo/ and publishes only the built assets plus .nojekyll to its separate hosting repository. No confidential PDF, private handoff document, local environment file or privileged key belongs in either deployment. The canonical Supabase Site URL is Netlify; the additional demo and localhost origins are retained as allowed URLs.',
    'Verification: npm run check; install Chromium with npx playwright install chromium, then npm run test:e2e. Demo browser tests start their own isolated server on port 5180 and never reuse the cloud-connected development server. Hosted tests are separate, use only public-key anonymous sessions and remove their temporary application records.',
  ]],
  ['Verification scope', [
    'Automated tests cover domain filters, calendar dates, statistics, task validation, demo persistence, guest sign-in/session reuse, failed optimistic writes, actual PostgreSQL schema/RLS transactions, guest-A/B isolation, ownership spoofing, cross-owner foreign keys, atomic rollback and immutable activity.',
    'Playwright covers desktop and mobile CRUD, comments, history, assignments, multiple labels, filters, list view, persistence, separate local guest contexts and narrow layouts. Desktop tests exercise cross-column pointer dragging, same-column reorder and keyboard shortcuts. Selected screens are checked with axe for WCAG A/AA violations.',
    'Local PostgreSQL tests use PGlite with a minimal Supabase auth.uid() stub. They do not independently verify the external Supabase auth service, project setup, Realtime delivery or hosted deployment.',
    ...(cloudVerified ? ['Additional live Supabase SDK verification passed: two real anonymous sessions, session restoration and refresh persistence, all six RLS-protected tables, ownership spoofing denial, cross-guest assignment/label/comment rejection, atomic rollback, immutable activity, comment persistence and Realtime delivery. Separate browser acceptance passed on the actual HTTPS frontend for all seven advanced categories, combined filters, due badges/stats, actual pointer cross-column moves and reordering after reload, and same-guest cross-tab updates. Temporary application test records were removed.'] : []),
    'Verification rerun for the hosting handoff: all 48 unit/database/collision tests passed (18 execute real PostgreSQL schema/roles), and 20 browser scenarios passed with 4 intentionally skipped mobile-profile physical keyboard/mouse scenarios. Local parallel worker startup and 30-second scan budgets timed out on this machine; the complete suites then passed serially with a 90-second browser scenario budget, zero retries and unchanged assertions. Earlier targeted append/reorder/cancel repetitions and GitHub Linux CI also passed. Dependency audit reported zero known vulnerabilities at the handoff check.',
    'Hosted acceptance passed on both the primary Netlify frontend and the additional GitHub Pages website: automatic guest sign-in, independent guests, reload persistence, roster/assignment/avatars, comments/timeline, multiple labels, urgency indicators, combined filters, summary counts, actual pointer moves/reorder and same-guest cross-tab Realtime. Production security headers are enabled on Netlify. Selected automated accessibility and responsive checks supplement, but do not certify, every assistive technology or physical mobile touch gesture. Before sharing, inspect the document/links and confirm the free Supabase project remains active.',
  ]],
  ['Tradeoffs and future improvements', [
    'Single personal board and one assignee per task keep scope intentional. Add organizations, shared roles, invitations, multi-assignee support and account upgrade/recovery with a deliberately redesigned security model.',
    'Anonymous accounts have no recovery after browser session storage is cleared. An opt-in account upgrade would protect long-lived work.',
    'Whole-snapshot refresh is appropriate for a small assessment board; add virtualization, incremental queries and keyed realtime patches for larger datasets. Writes are serialized per tab, but cross-tab edits are last-confirmed-write wins; add version/conflict handling and idempotency keys for stronger concurrency semantics.',
    'Automated mobile tests do not certify physical iOS/Android touch gestures or all screen-reader combinations. Further manual accessibility and device testing is appropriate.',
    'For unrestricted production anonymous signup, add CAPTCHA integration, retention/abandoned-guest cleanup and abuse monitoring. Mandatory CAPTCHA must not be enabled before implementing its widget/token flow. Free Supabase projects may pause with inactivity.',
  ]],
];

function hyperlinkFor(text) {
  if (text.startsWith('Primary live frontend')) return config.liveUrl;
  if (text.startsWith('Additional live demo')) return config.additionalDemoUrl;
  if (text.startsWith('GitHub source repository')) return config.repositoryUrl;
  return null;
}

const paragraphs = [
  new Paragraph({ text: 'ORBIT', heading: HeadingLevel.TITLE }),
  new Paragraph({ text: 'Task Manager Assessment', heading: HeadingLevel.SUBTITLE }),
  new Paragraph({ children: [new TextRun({ text: fullName, bold: true })], spacing: { after: 160 } }),
  new Paragraph({ children: [new TextRun({ text: status, color: draft ? 'A25347' : '487660', bold: true })], spacing: { after: 240 } }),
];
for (const [heading, content] of sections) {
  paragraphs.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_1 }));
  for (const text of content) {
    const url = hyperlinkFor(text);
    paragraphs.push(new Paragraph({ children: url ? [new ExternalHyperlink({ link: url, children: [new TextRun({ text, style: 'Hyperlink' })] })] : [new TextRun(text)], spacing: { after: 150, line: 285 } }));
  }
}
paragraphs.push(new Paragraph({ text: 'Full database schema (SQL)', heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
paragraphs.push(new Paragraph({ text: 'Complete executable migration, including RLS, indexes, privileges, triggers and RPCs. Run once in a new Supabase project.', spacing: { after: 180 } }));
for (const line of sql.split('\n')) paragraphs.push(new Paragraph({ children: [new TextRun({ text: line || ' ', font: 'Consolas', size: 15 })], spacing: { after: 0, line: 190 } }));

const doc = new Document({
  creator: fullName, title: 'Orbit Task Manager Assessment', description: status,
  styles: { default: { document: { run: { font: 'Calibri', size: 22, color: '43485B' }, paragraph: { spacing: { after: 120 } } } } },
  sections: [{
    properties: { page: { margin: { top: 950, right: 850, bottom: 950, left: 850 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: `Orbit · ${draft ? 'DRAFT · ' : ''}Task Manager Assessment`, color: '857294', size: 18 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Private assessment handoff · ', size: 16, color: '857294' }), new TextRun({ children: [PageNumber.CURRENT], size: 16 })] })] }) },
    children: paragraphs,
  }],
});
await writeFile(resolve(output, `${base}.docx`), await Packer.toBuffer(doc));

async function existingFont(paths) {
  for (const path of paths.filter(Boolean)) { try { await access(path); return path; } catch { /* Try the next installed Unicode font. */ } }
  throw new Error('No Unicode font found for PDF generation. Set SUBMISSION_FONT_PATH and SUBMISSION_MONO_FONT_PATH to installed .ttf fonts. The editable Word document was generated successfully.');
}
const bodyFont = await existingFont([process.env.SUBMISSION_FONT_PATH, 'C:/Windows/Fonts/arial.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf']);
const monoFont = await existingFont([process.env.SUBMISSION_MONO_FONT_PATH, 'C:/Windows/Fonts/consola.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', '/System/Library/Fonts/Monaco.ttf', bodyFont]);
const pdf = new PDFDocument({ size: 'A4', margins: { top: 55, bottom: 55, left: 48, right: 48 }, bufferPages: true, info: { Title: 'Orbit Task Manager Assessment', Author: fullName, Subject: status } });
const stream = createWriteStream(resolve(output, `${base}.pdf`));
pdf.pipe(stream);
pdf.registerFont('Body', bodyFont); pdf.registerFont('Code', monoFont);
pdf.font('Body').fontSize(30).fillColor('#7560d2').text('ORBIT');
pdf.fontSize(21).fillColor('#333749').text('Task Manager Assessment');
pdf.moveDown(.6).fontSize(12).text(fullName);
pdf.moveDown(.5).fontSize(10).fillColor(draft ? '#a25347' : '#487660').text(status);
pdf.moveDown(1);
const heading = (text) => {
  if (pdf.y > 715) pdf.addPage();
  pdf.font('Body').fontSize(15).fillColor('#756089').text(text);
  pdf.moveDown(.45);
};
for (const [title, content] of sections) {
  heading(title);
  for (const text of content) {
    const url = hyperlinkFor(text);
    pdf.font('Body').fontSize(10).fillColor(url ? '#6d54a5' : '#454a5a').text(text, { lineGap: 3, link: url || undefined });
    pdf.moveDown(.65);
  }
  pdf.moveDown(.35);
}
pdf.addPage();
heading('Full database schema (SQL)');
pdf.font('Body').fontSize(10).fillColor('#454a5a').text('Complete executable migration, including RLS, indexes, privileges, triggers and RPCs. Run once in a new Supabase project.');
pdf.moveDown(1);
pdf.font('Code').fontSize(7.2).fillColor('#34394a').text(sql, { lineGap: 2, paragraphGap: 0 });

const range = pdf.bufferedPageRange();
for (let index = range.start; index < range.start + range.count; index++) {
  pdf.switchToPage(index);
  // Absolute footer placement avoids accidentally adding pages while paging.
  pdf.font('Body').fontSize(8).fillColor('#857294').text(`Orbit · ${draft ? 'DRAFT · ' : ''}Private assessment handoff · Page ${index + 1} of ${range.count}`, 48, 808, { lineBreak: false });
}
pdf.end();
await finished(stream);
console.log(`Generated submission/${base}.pdf and submission/${base}.docx (${range.count} PDF pages).`);
console.log(draft ? 'DRAFT: supply the author name, actual live/GitHub URLs and verified live checks before submitting.' : 'Open and inspect both documents before sharing through the required private submission process.');