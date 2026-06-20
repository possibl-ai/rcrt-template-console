import { defineSchema } from '@possibl/rcrt-app-kit/core';

// All persistence is interpret:* tagged breadcrumbs — there is no database.
// `defineSchema` binds a tag + content type + schema_version into one typed
// handle (Item.query / .create / .patch / .upsertByName). Add your own domain
// shapes here; they're the only place breadcrumb tags live.

// ── Items — the example collection shape ─────────────────────────────────────
export interface ItemContent extends Record<string, unknown> {
  name: string;
  status: 'open' | 'done';
  note?: string;
}

export const Item = defineSchema<ItemContent>({
  tag: 'interpret:item',
  version: 1,
});

/**
 * Tag stamped onto seeded demo rows so they're easy to find and clear (see
 * `src/lib/sample-data.ts`). Real user-created rows omit it. Seeding demo data
 * with a known tag is the pattern the AI builder copies to make a generated app
 * look alive on first load.
 */
export const SAMPLE_TAG = 'sample:seed';

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
