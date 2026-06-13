import { defineSchema } from '@possibl/rcrt-app-kit/core';

// All persistence is interpret:* tagged breadcrumbs — there is no database.
// `defineSchema` binds a tag + content type + schema_version into one typed
// handle (Item.query / .create / .patch / .upsertByName). Add your own domain
// shapes here; they're the only place breadcrumb tags live.

export interface ItemContent extends Record<string, unknown> {
  name: string;
  status: 'open' | 'done';
  note?: string;
}

export const Item = defineSchema<ItemContent>({
  tag: 'interpret:item',
  version: 1,
});
