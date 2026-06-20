import type { RcrtClient } from '@possibl/rcrt-sdk';
import { getClient } from './api-client';
import { tenantId } from './firebase-config';
import { Item, SAMPLE_TAG, type ItemContent } from './schemas';

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE-DATA SEEDING — the copyable pattern.
//
// A vibecode app should never open to a dead, empty screen. Seeding a handful of
// realistic rows makes the first render feel alive AND gives the advisor real
// breadcrumbs to reason over. This is the exact pattern the AI builder should
// reuse for any new collection:
//
//   1. Define the demo rows (typed by your schema's content interface).
//   2. Create each as an `interpret:*` breadcrumb via `Schema.create(...)`,
//      stamping a known marker tag (SAMPLE_TAG) so seeds are findable/removable.
//   3. Make it idempotent: don't double-seed if sample rows already exist.
//
// Call it from an empty-state "Load sample data" button (see Home/Items) — never
// auto-seed on boot (that would fight a user who intentionally cleared data).
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_ITEMS: ItemContent[] = [
  { name: 'Welcome to your RCRT app', status: 'open', note: 'This is sample data — clear it from Settings any time.' },
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

/** Remove every seeded demo item (leaves real, user-created rows untouched). */
export async function clearSampleItems(client: RcrtClient = getClient().forTenant(tenantId)): Promise<number> {
  const samples = await Item.query(client, { tags: [SAMPLE_TAG], limit: 1000 });
  for (const row of samples) {
    await client.breadcrumbs.delete(row.id);
  }
  return samples.length;
}
