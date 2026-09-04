# Project Journey + No-Data-Loss Sync

Two workstreams, shipped together.

---

## 1. Project Journey (in `TaskProjects` / new `ProjectDetail`)

### Data model — new tables (all scoped to `task_projects`)

**`project_milestones`**
- `project_id`, `title`, `description`, `status` (planned / in_progress / done / blocked), `target_date`, `completed_at`, `progress` (0–100), `sort_order`, `created_by`

**`project_journey_entries`** (single timeline feed)
- `project_id`, `entry_type` (note | update | status_change | milestone | file | event), `title`, `body` (rich text/markdown), `metadata` (jsonb — e.g. old/new status, milestone_id, file refs), `author_id`, `occurred_at`

**`project_files`**
- `project_id`, `journey_entry_id` (nullable), `file_name`, `storage_path` (bucket: `media/project-files/<project_id>/...`), `mime_type`, `size_bytes`, `uploaded_by`

### Visibility (RLS)
- Admins: full access to all three.
- Team members: access only if the project's `created_by` is them **or** they have a matching allocation in `customer_team_allocations` for that project's client, **or** they are the author of the entry.
- We add a small helper `is_project_member(_user_id, _project_id)` (SECURITY DEFINER) used by every policy.
- Auto-logging via triggers: when `task_projects.is_archived` flips, when a milestone status changes, when a file is added → insert a matching `project_journey_entries` row of type `event`.

### UI — new page `src/pages/admin/ProjectDetail.tsx`
Route: `/admin/tasks/projects/:id`. Left nav from the existing project card ("Open journey" link).

Tabs:
1. **Overview** — project meta, edit inline (name, client, description, color, status).
2. **Timeline** — reverse-chronological feed of `project_journey_entries` (system events + manual notes + status changes + file uploads). Compose box at top for a quick note or update.
3. **Milestones** — kanban-style list (planned → in progress → done), drag to reorder, edit target date, progress slider.
4. **Files** — grid of `project_files` with upload zone (resumable, see §2).
5. **Tasks** — existing tasks filtered by project (link to Tasks page).

Timeline card design mirrors the existing admin surface (`bg-surface-white`, `border-border`, rounded-xl, brand accent color from `project.color`).

---

## 2. Sync / resync — no data loss on tab switch

Three layers so nothing is lost regardless of what the user was doing.

### A. Extend local draft persistence to every admin form
- Audit every admin create/edit form. The ones already using `useEditingDraft` / `useDraftPersistence` (CRM, Brands, etc.) stay as-is.
- Wrap the remaining forms (project create/edit, milestone editor, journey note composer, task edit dialog, blog post editor, city page editor, testimonial editor, hero slide editor, invoice draft, etc.) with `useEditingDraft` so their in-progress state survives tab switches and reloads.
- Add a small "Draft restored" toast + a "Discard draft" button in each editor header for clarity.

### B. Server-side autosave for long-form editors
New table **`content_drafts`** (`user_id`, `scope`, `entity_id nullable`, `payload jsonb`, `updated_at`) with strict RLS (`user_id = auth.uid()`).

New hook `useServerDraft(scope, entityId)`:
- Debounced (2s) upsert to `content_drafts` while the user types.
- On mount: load latest server draft; if newer than local draft, prompt "Restore your last edit from <time>?".
- Cleared on successful save.

Applied to: project journey note composer, milestone editor, blog post editor, invoice editor, task detail edit. Short forms keep just localStorage (layer A).

### C. Resumable / resilient file uploads
New hook `useResumableUpload`:
- Uses Supabase Storage's TUS resumable endpoint (`@supabase/storage-js` `uploadToSignedUrl` with `upsert` + tus protocol) so a paused/backgrounded tab can resume the same upload on return.
- Chunks (6 MB) tracked in `localStorage` (`upload_<hash>` → uploaded offset, storage path, target row).
- On page load, an `UploadResumeBanner` at the top of the admin layout scans for pending uploads and offers "Resume 2 pending uploads".
- Applied first to: **project files**, **file manager**, **invoice attachments**, **case-study images**, **blog post images**, **hero slides**, **social posts**, **customer files**. Any single-image quick-picker (avatar, logo) stays with the simple upload path (small files, low risk).
- Progress and state persisted so switching tabs mid-upload never loses bytes.

### D. Global sync indicator
`SyncButton` in `AdminLayout` already exists — extend it to:
- Show a small dot when unsaved server drafts or in-flight uploads exist.
- Clicking "Sync" flushes pending server-draft debounces immediately and retries any failed upload chunks.

---

## Technical notes

- **Migrations, in order:**
  1. `project_milestones`, `project_journey_entries`, `project_files` + `is_project_member` helper + RLS + auto-log triggers + grants.
  2. `content_drafts` + RLS + grants.
  3. Storage: create `project-files` folder convention inside existing `media` bucket; add narrow `storage.objects` policies for `media/project-files/*` restricted via `is_project_member`.
- **Realtime:** enable on `project_journey_entries` so the timeline updates live while multiple team members work in the same project.
- **Auto-logging triggers:** `AFTER UPDATE` on `task_projects` (status/archive changes), `AFTER INSERT/UPDATE` on `project_milestones` (created/completed), `AFTER INSERT` on `project_files` (file added). Each writes a `project_journey_entries` row with the actor from `auth.uid()`.
- **Types regenerate** after each migration approval; frontend code lands after types exist.
- **Route wiring:** add `/admin/tasks/projects/:id` in `src/App.tsx` inside the `AdminLayout` group and add an "Open" link to each card in `TaskProjects.tsx`.

---

## Deliverables checklist

- [ ] 3 migrations approved and applied
- [ ] `ProjectDetail` page with Overview / Timeline / Milestones / Files / Tasks tabs
- [ ] Auto-logged journey events working end-to-end
- [ ] `useServerDraft` hook + applied to long editors
- [ ] `useResumableUpload` hook + `UploadResumeBanner` in `AdminLayout`
- [ ] Draft persistence extended to remaining admin forms
- [ ] Timeline live-updates via Realtime
- [ ] Manual QA: start upload → switch tabs → return → upload completes; start editing a blog post → close tab → reopen → draft restored

Approve and I'll ship it migration-by-migration so you can review each step.
