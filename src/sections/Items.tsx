import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCached } from '@possibl/rcrt-app-kit/core';
import {
  defineSection,
  defineAnchor,
  defineForm,
  SectionPage,
  useAppForm,
} from '@possibl/rcrt-app-kit/shell';
import {
  Button,
  DataTable,
  Badge,
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
import { ItemRecord } from './ItemRecord';

const anchors = {
  list: defineAnchor({ label: 'Items table' }),
  newItem: defineAnchor({ label: 'New item button' }),
};
const NewItemAnchor = anchors.newItem.Anchor;

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

function ItemsBody() {
  const navigate = useNavigate();
  const items = useCached('items:all', () => Item.query(getClient().forTenant(tenantId)));
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; note: string }>({ name: '', note: '' });
  const [saving, setSaving] = useState(false);

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

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Name', render: (r) => r.content.name, sortValue: (r) => r.content.name },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.content.status === 'done' ? 'success' : 'accent'}>{r.content.status}</Badge>
      ),
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
      <anchors.list.Anchor>
        {items.data === undefined ? (
          <SkeletonPanel />
        ) : (
          <DataTable
            columns={columns}
            rows={items.data}
            rowKey={(r) => r.id}
            onRowClick={(r) => navigate(`/items/${r.id}`)}
            empty={<EmptyState title="No items" hint="Create your first item." />}
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
  description: 'Collection of workspace items. Click a row for the full record.',
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
