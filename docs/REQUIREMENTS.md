# Assessment requirements traceability

This is a solution checklist, not a reproduction of the confidential source PDF.

| Requirement | Implementation | Verification / outstanding work |
| --- | --- | --- |
| Polished Kanban UI | Custom Orbit design, four responsive columns, cohesive palette and system typography | Visual browser inspection; automated desktop/mobile workflows |
| To Do / In Progress / In Review / Done | Typed fixed statuses, database check constraints | Domain and PostgreSQL constraint tests |
| Create tasks | Title, description, priority, date, assignee and labels form | Unit/database and browser CRUD tests |
| Drag tasks to update status | dnd-kit pointer/keyboard sensors, optimistic drop, transactional saves | Desktop cross-column drag, reorder and refresh tests |
| Loading and error states | Skeletons, inline/banner errors, retry, busy controls, toast, empty states | Corrupt storage and failed-mutation tests; manual state checks |
| Supabase persistence | Supabase adapter, tasks schema and two transactional RPCs | Real migration/RPC tests locally; live project connection pending |
| Required task fields | UUID primary key, title, checked status, guest user_id FK, auto-created timestamp | PostgreSQL defaults/constraints tests |
| Automatic anonymous guest sign-in | Supabase Auth SDK with existing-session reuse and deduplication | Mocked SDK unit tests; live provider verification pending |
| Guest isolation / RLS | Six tables protected; composite owner foreign keys | Actual PostgreSQL guest-A/B adversarial tests; live two-browser check pending |
| Optional team and assignees | Guest-owned roster with name/color/initials, one assignee per task | Browser assignment and database removal/isolation tests |
| Optional task comments | Separate comments table, chronological timestamps, safe text | Browser persistence and database checks |
| Optional activity log | Database-only triggers for creation and field/tag changes | Database audit immutability and browser history tests |
| Optional labels | Multiple task labels, custom names/colors, filtering | Browser multi-tag and database link tests |
| Optional due indicators | Local-calendar urgency, completed exemption | Domain tests and card badges |
| Optional search/filtering | Title, priority, assignee/unassigned, label and due views | Combined-filter domain/browser tests |
| Optional summary | Total, complete, overdue, progress percentage | Domain statistics tests |
| GitHub sharing | Ignore protections and CI workflow supplied | Actual owner repository creation/push pending |
| Free live hosting | Vercel and Netlify configs and instructions supplied | Actual owner deployment and verified live URL pending |
| Full schema shared | Complete executable migration embedded by document generator | Local migration executes successfully |
| Final PDF/Word document | Generator produces both, with a draft safety marker | Owner name, actual URLs, live verification and upload pending |
| No exposed admin key / no committed secrets | Public-key-only frontend config, secret rejection, ignored env files | Config tests, runtime dependency audit, pre-commit inspection required |
| Confidential assessment handling | Supplied PDF never copied into public assets/docs and all PDFs ignored | Inspect staged files before publishing |

**Optional backend API:** intentionally not added; direct Supabase with RLS and database RPCs satisfies the permitted approach.