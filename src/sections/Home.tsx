import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCached } from '@possibl/rcrt-app-kit/core';
import { SectionPage } from '@possibl/rcrt-app-kit/shell';
import { StatCard, Card, Button, Badge, EmptyState, SkeletonPanel } from '@possibl/rcrt-app-kit/ui';
import { LayoutDashboard, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { defineSection, defineAnchor } from '@possibl/rcrt-app-kit/shell';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { Item } from '../lib/schemas';
import { seedSampleItems } from '../lib/sample-data';

// A section is a DOMAIN COMPONENT slotted into the registry. The shell renders
// the header/refresh/UpdatedAgo chrome (SectionPage cache=…); you write only
// the body. Anchors are components (anchors.kpis.Anchor) — the advisor can
// spotlight them, and an undeclared anchor is unrenderable.

const anchors = {
  kpis: defineAnchor({ label: 'KPI strip (item counts)' }),
  recent: defineAnchor({ label: 'Recent items list' }),
};

function HomeBody() {
  const navigate = useNavigate();
  const items = useCached('home:items', () => Item.query(getClient().forTenant(tenantId)));
  const [seeding, setSeeding] = useState(false);
  const rows = items.data ?? [];
  const open = rows.filter((r) => r.content.status !== 'done').length;
  const done = rows.length - open;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  const seed = async () => {
    if (seeding) return;
    setSeeding(true);
    await seedSampleItems();
    setSeeding(false);
    void items.refresh();
  };

  return (
    <SectionPage title="Home" subtitle="Workspace at a glance" cache={items}>
      <anchors.kpis.Anchor
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}
      >
        <StatCard label="Items" value={rows.length} icon={<LayoutDashboard />} />
        <StatCard label="Open" value={open} tone="accent" icon={<Circle />} />
        <StatCard label="Done" value={done} tone="success" icon={<CheckCircle2 />} />
        <StatCard label="Completion" value={`${pct}%`} tone={pct === 100 ? 'success' : 'default'} hint={`${done} of ${rows.length || 0} complete`} />
      </anchors.kpis.Anchor>

      <anchors.recent.Anchor style={{ display: 'grid', gap: '0.5rem' }}>
        {items.data === undefined ? (
          <SkeletonPanel />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Sparkles />}
            title="Your workspace is ready"
            hint="Seed a few sample items to see the dashboard, list and advisor come alive — or jump straight to creating your own."
            action={
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Button size="sm" onClick={() => void seed()} loading={seeding}>
                  Load sample data
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/items')}>
                  Go to Items
                </Button>
              </div>
            }
          />
        ) : (
          rows.slice(0, 5).map((r) => (
            <Card key={r.id}>
              <div
                onClick={() => navigate(`/items/${r.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer' }}
              >
                <span>{r.content.name}</span>
                <Badge tone={r.content.status === 'done' ? 'success' : 'accent'}>{r.content.status}</Badge>
              </div>
            </Card>
          ))
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
  description: 'Dashboard: item counts, completion rate + the five most recent items.',
  component: HomeBody,
  anchors,
});
