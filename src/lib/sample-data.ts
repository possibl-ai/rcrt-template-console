import { defineSchema } from '@possibl/rcrt-app-kit/core';
import type { RcrtClient } from '@possibl/rcrt-sdk';
import { getClient } from './api-client';
import { tenantId } from './firebase-config';

// ═════════════════════════════════════════════════════════════════════════════
// EXAMPLE SCAFFOLD — the `Item` demo collection. SELF-CONTAINED + SAFE TO DELETE.
//
// This module is the SINGLE home of the example collection's data layer: its
// schema (`Item` / `ItemContent`), its marker tag, and its seed/clear helpers.
// It is consumed by `src/sections/Items.tsx`, `src/sections/ItemRecord.tsx` and
// the item widgets in `src/sections/Home.tsx`.
//
// Because the example schema lives HERE (not in `schemas.ts`), defining your own
// real schemas in `schemas.ts` never orphans these files. When your app has no
// `Item` collection, remove the example as a UNIT:
//   1. Delete this file, `src/sections/Items.tsx`, `src/sections/ItemRecord.tsx`.
//   2. Add YOUR schema(s) in `src/lib/schemas.ts` (where `WorkspaceSettings` is).
//   3. Remove `items` (and the `create_item` advisor action) from `app.config.tsx`.
//   4. Replace/remove the item widgets in `src/sections/Home.tsx`.
// Or REPURPOSE it: rename `Item`→your entity, `ItemContent`→your content type,
// keep the structure. Either way, `npm run build` must stay green.
// ═════════════════════════════════════════════════════════════════════════════

// All persistence is `interpret:*` tagged breadcrumbs — there is no database.
// `defineSchema` binds a tag + content type + schema_version into one typed
// handle (Item.query / .create / .patch / .upsertByName). NOTE: there is no
// `Item.delete(...)` — to delete a row call `client.breadcrumbs.delete(id)`
// (see `clearSampleItems` below for the exact pattern).
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
 * Tag stamped onto seeded demo rows so they're easy to find and clear. Real
 * user-created rows omit it. Seeding demo data with a known tag is the pattern
 * the AI builder copies to make a generated app look alive on first load.
 */
export const SAMPLE_TAG = 'sample:seed';

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE-DATA SEEDING — the copyable pattern.
//
// A vibecode app should never open to a dead, empty screen. Seeding a handful of
// realistic rows makes the first render feel alive AND gives the advisor real
// breadcrumbs to reason over:
//   1. Define the demo rows (typed by your schema's content interface).
//   2. Create each as an `interpret:*` breadcrumb via `Item.create(...)`,
//      stamping a known marker tag (SAMPLE_TAG) so seeds are findable/removable.
//   3. Make it idempotent: don't double-seed if sample rows already exist.
//
// Call it from an empty-state "Load sample data" button (see Home/Items) — never
// auto-seed on boot (that would fight a user who intentionally cleared data).
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_ITEMS: ItemContent[] = [
  { name: 'Welcome to your RCRT app', status: 'open', note: 'This is sample data — clear it any time.' },
  { name: 'Invite a teammate', status: 'open', note: 'Share the workspace so others can collaborate.' },
  { name: 'Connect your first integration', status: 'open' },
  { name: 'Review the weekly summary', status: 'done', note: 'Ask the advisor: "what changed this week?"' },
  { name: 'Archive last quarter', status: 'done' },
];

/**
 * Seed demo items into the active workspace. Idempotent: if any sample row
 * already exists it does nothing and returns 0. Returns the number created.
 */
export async function seedSampleItems(client: RcrtClient = getClient().forTenant(tenantId)): Promise<number> {
  const existingSamples = await Item.query(client, { tags: [SAMPLE_TAG], limit: 1 });
  if (existingSamples.length > 0) return 0;

  let created = 0;
  for (const content of DEMO_ITEMS) {
    await Item.create(client, {
      name: `item:${content.name}`,
      title: content.name,
      content,
      tags: [SAMPLE_TAG], // marker tag → seeds are easy to find + clear
    });
    created++;
  }
  return created;
}

/**
 * Remove every seeded demo item (leaves real, user-created rows untouched).
 * NOTE the deletion API: there is no `Item.delete` — you query the rows then
 * call `client.breadcrumbs.delete(id)` on each.
 */
export async function clearSampleItems(client: RcrtClient = getClient().forTenant(tenantId)): Promise<number> {
  const samples = await Item.query(client, { tags: [SAMPLE_TAG], limit: 1000 });
  for (const row of samples) {
    await client.breadcrumbs.delete(row.id);
  }
  return samples.length;
}
