import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCached } from '@possibl/rcrt-app-kit/core';
import {
  defineSection,
  defineAnchor,
  defineForm,
  SectionPage,
  useAppForm,
  type SectionComponentProps,
} from '@possibl/rcrt-app-kit/shell';
import {
  Button,
  DataTable,
  Badge,
  Tabs,
  EmptyState,
  SkeletonPanel,
  Modal,
  ModalHeader,
  type Column,
} from '@possibl/rcrt-app-kit/ui';
import { ListChecks } from 'lucide-react';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { Item, type ItemContent } from '../lib/schemas';
import { seedSampleItems } from '../lib/sample-data';
import { ItemRecord } from './ItemRecord';

const anchors = {
  list: defineAnchor({ label: 'Items table' }),
  newItem: defineAnchor({ label: 'New item button' }),
};
const NewItemAnchor = anchors.newItem.Anchor;

// Tabs are ABSTRACT in the registry (declared on the section below). The web
// shell maps them to `?tab=` and hands the body { tab, setTab }; the body renders
// the <Tabs> control and filters. (Native's SectionScreen renders the tab bar
// for you — same registry, different renderer.) Page context becomes
// `items:open` / `items:done` automatically, so the advisor knows the filter.
const TABS = ['all', 'open', 'done'] as const;
type TabId = (typeof TABS)[number];

// A prefillable form. `intent`/`entity`/`distinguishFrom` are structured manifest
// fields (not free prose) so the advisor can prefill it precisely; the shell
// validates the prefill against `fields`.
const newItem = defineForm({
  title: 'New item',
  intent: 'Create a work item in this workspace. The advisor may prefill the name/note; the user submits.',
  entity: 'item',
  fields: {
    name: { required: true, description: 'Short item title' },
    note: { description: 'Optional detail' },
  },
});

type Row = Awaited<ReturnType<typeof Item.query>>[number];

function ItemsBody({ tab, setTab }: SectionComponentProps) {
  const navigate = useNavigate();
  const items = useCached('items:all', () => Item.query(getClient().forTenant(tenantId)));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; note: string }>({ name: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const active = (tab ?? 'all') as TabId;
  const all = items.data ?? [];
  const rows = all.filter((r) =>
    active === 'all' ? true : active === 'done' ? r.content.status === 'done' : r.content.status !== 'done',
  );
  const counts = {
    all: all.length,
    open: all.filter((r) => r.content.status !== 'done').length,
    done: all.filter((r) => r.content.status === 'done').length,
  };

  // Consume advisor form prefills: when the advisor asks to open "items.new-item"
  // with researched values, the shell hands them here (validated to the fields).
  const prefill = useAppForm(newItem);
  useEffect(() => {
    if (prefill.requested) {
      setDraft({ name: prefill.prefill.name ?? '', note: prefill.prefill.note ?? '' });
      setOpen(true);
      prefill.clear();
    }
  }, [prefill]);

  const save = async () => {
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    const content: ItemContent = { name: draft.name.trim(), status: 'open', note: draft.note.trim() || undefined };
    await Item.create(getClient().forTenant(tenantId), {
      name: `item:${draft.name.trim()}`,
      title: draft.name.trim(),
      content,
    });
    setSaving(false);
    setOpen(false);
    setDraft({ name: '', note: '' });
    void items.refresh();
  };

  const seed = async () => {
    if (seeding) return;
    setSeeding(true);
    await seedSampleItems();
    setSeeding(false);
    void items.refresh();
  };

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Name', render: (r) => r.content.name, sortValue: (r) => r.content.name },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.content.status === 'done' ? 'success' : 'accent'}>{r.content.status}</Badge>
      ),
      sortValue: (r) => r.content.status,
    },
  ];

  return (
    <SectionPage
      title="Items"
      subtitle="Workspace items"
      cache={items}
      actions={
        <NewItemAnchor as="span">
          <Button size="sm" onClick={() => setOpen(true)}>
            New item
          </Button>
        </NewItemAnchor>
      }
    >
      <div style={{ marginBottom: '0.75rem' }}>
        <Tabs<TabId>
          items={[
            { id: 'all', label: 'All', badge: <Badge>{counts.all}</Badge> },
            { id: 'open', label: 'Open', badge: <Badge tone="accent">{counts.open}</Badge> },
            { id: 'done', label: 'Done', badge: <Badge tone="success">{counts.done}</Badge> },
          ]}
          value={active}
          onChange={setTab}
        />
      </div>

      <anchors.list.Anchor>
        {items.data === undefined ? (
          <SkeletonPanel />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/items/${r.id}`)}
            empty={
              all.length === 0 ? (
                <EmptyState
                  title="No items yet"
                  hint="Create your first item, or load a few samples to explore the template."
                  action={
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <Button size="sm" onClick={() => setOpen(true)}>
                        New item
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void seed()} loading={seeding}>
                        Load sample data
                      </Button>
                    </div>
                  }
                />
              ) : (
                <EmptyState title={`No ${active} items`} hint="Try a different tab." />
              )
            }
          />
        )}
      </anchors.list.Anchor>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHeader title="New item" onClose={() => setOpen(false)} />
        <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
          <input
            className="rcrt-input"
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <input
            className="rcrt-input"
            placeholder="Note (optional)"
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          />
          <Button onClick={() => void save()} loading={saving} disabled={!draft.name.trim()}>
            Create
          </Button>
        </div>
      </Modal>
    </SectionPage>
  );
}

export const items = defineSection({
  id: 'items',
  path: '/items',
  label: 'Items',
  icon: ListChecks,
  navGroup: 'Workspace',
  description: 'Collection of workspace items, filterable by All / Open / Done. Click a row for the full record.',
  tabs: TABS,
  defaultTab: 'all',
  component: ItemsBody,
  anchors,
  forms: { 'new-item': newItem },
  // A nested, deep-linkable record route — /items/:id, a full-bleed takeover.
  records: {
    item: {
      path: ':id',
      label: 'Item record',
      description: 'Full-screen item record. Deep-linkable by breadcrumb id.',
      component: ItemRecord,
      chrome: false,
      // Async page context: the URL only has the id; resolve the NAME so the
      // advisor is grounded with "item:Onboarding", not "item:<uuid>".
      context: async ({ params }) => {
        const rows = await Item.query(getClient().forTenant(tenantId), { limit: 200 });
        const match = rows.find((r) => r.id === params.id);
        return `item:${match?.content.name ?? params.id}`;
      },
    },
  },
});
