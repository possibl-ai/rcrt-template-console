import { useCached } from '@possibl/rcrt-app-kit/core';
import { SectionPage } from '@possibl/rcrt-app-kit/shell';
import { StatCard, Card, EmptyState, SkeletonPanel } from '@possibl/rcrt-app-kit/ui';
import { LayoutDashboard } from 'lucide-react';
import { defineSection, defineAnchor } from '@possibl/rcrt-app-kit/shell';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { Item } from '../lib/schemas';

// A section is a DOMAIN COMPONENT slotted into the registry. The shell renders
// the header/refresh/UpdatedAgo chrome (SectionPage cache=…); you write only
// the body. Anchors are components (anchors.kpis.Anchor) — the advisor can
// spotlight them, and an undeclared anchor is unrenderable.

const anchors = {
  kpis: defineAnchor({ label: 'KPI strip (item counts)' }),
  recent: defineAnchor({ label: 'Recent items list' }),
};

function HomeBody() {
  const items = useCached('home:items', () => Item.query(getClient().forTenant(tenantId)));
  const rows = items.data ?? [];
  const open = rows.filter((r) => r.content.status !== 'done').length;

  return (
    <SectionPage title="Home" subtitle="Workspace at a glance" cache={items}>
      <anchors.kpis.Anchor
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8rem, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}
      >
        <StatCard label="Items" value={rows.length} />
        <StatCard label="Open" value={open} tone="accent" />
        <StatCard label="Done" value={rows.length - open} tone="success" />
      </anchors.kpis.Anchor>

      <anchors.recent.Anchor style={{ display: 'grid', gap: '0.5rem' }}>
        {items.data === undefined ? (
          <SkeletonPanel />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing here yet" hint="Add an item from the Items section to see it here." />
        ) : (
          rows.slice(0, 5).map((r) => <Card key={r.id}>{r.content.name}</Card>)
        )}
      </anchors.recent.Anchor>
    </SectionPage>
  );
}

export const home = defineSection({
  id: 'home',
  path: '/home',
  label: 'Home',
  icon: LayoutDashboard,
  navSlot: 'top',
  description: 'Dashboard: item counts + the five most recent items.',
  component: HomeBody,
  anchors,
});
