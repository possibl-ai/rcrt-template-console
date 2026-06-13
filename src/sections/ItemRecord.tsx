import { useCached } from '@possibl/rcrt-app-kit/core';
import { defineAnchor, type RecordComponentProps } from '@possibl/rcrt-app-kit/shell';
import { Card, Button, Badge, SkeletonPanel, EmptyState } from '@possibl/rcrt-app-kit/ui';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { Item } from '../lib/schemas';

// A RECORD ROUTE component (chrome:false → full-bleed: no shell header/nav rail;
// it renders its own header). `close()` navigates back to the parent section.
// Declared as the section's `records.item` — the shell routes /items/:id here,
// projects it into the ui-manifest and grounds the advisor with the resolved
// item name (see the section's async `context`).

const recordAnchors = { header: defineAnchor({ label: 'Item record header' }) };

export function ItemRecord({ params, close }: RecordComponentProps) {
  const detail = useCached(`item:${params.id}`, async () => {
    const rows = await Item.query(getClient().forTenant(tenantId), { limit: 200 });
    return rows.find((r) => r.id === params.id) ?? null;
  });
  const item = detail.data?.content;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <recordAnchors.header.Anchor as="section" className="rcrt-header">
        <Button variant="ghost" size="sm" onClick={close}>
          ← Items
        </Button>
        <div className="rcrt-header-spacer" />
        {item && <Badge tone={item.status === 'done' ? 'success' : 'accent'}>{item.status}</Badge>}
      </recordAnchors.header.Anchor>

      <main className="rcrt-main rcrt-section-page">
        {detail.data === undefined ? (
          <SkeletonPanel />
        ) : !item ? (
          <EmptyState
            title="Item not found"
            hint="It may have been removed, or the link is stale."
            action={
              <Button size="sm" onClick={close}>
                Back to items
              </Button>
            }
          />
        ) : (
          <Card>
            <h2 style={{ margin: '0 0 0.5rem' }}>{item.name}</h2>
            {item.note && <p style={{ color: 'var(--rcrt-muted-fg)' }}>{item.note}</p>}
          </Card>
        )}
      </main>
    </div>
  );
}
