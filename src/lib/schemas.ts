import { defineSchema } from '@possibl/rcrt-app-kit/core';

// This is where YOUR domain shapes live. All persistence is `interpret:*` tagged
// breadcrumbs — there is no database. `defineSchema<T>({ tag, version })` binds a
// tag + content type + schema_version into one typed handle that exposes EXACTLY
// `.query` / `.create` / `.patch` / `.upsertByName` (+ readonly `.tag` / `.version`).
// There is no `.delete` on a handle — delete a row with `client.breadcrumbs.delete(id)`.
//
// The example `Item` collection's schema deliberately lives in `./sample-data.ts`
// (the self-contained example unit), NOT here — so adding your own schemas below
// never orphans the example files. Add your real shapes here; repurpose or delete
// the `Item` example as described in `./sample-data.ts`.

// ── Workspace settings — a name-keyed SINGLETON breadcrumb ───────────────────
// Not every shape is a collection. `upsertByName` gives you an idempotent
// singleton: one breadcrumb per workspace, read with `.query()[0]`, written
// with `.upsertByName(...)`. The Settings section uses this to persist a couple
// of app preferences as a breadcrumb (still no database).
export interface WorkspaceSettingsContent extends Record<string, unknown> {
  displayName: string;
  /** Where new items default their status. */
  defaultStatus: 'open' | 'done';
}

export const WorkspaceSettings = defineSchema<WorkspaceSettingsContent>({
  tag: 'interpret:app-settings',
  version: 1,
});

/** The fixed breadcrumb name for the settings singleton (one per workspace). */
export const SETTINGS_NAME = 'app-settings:default';
