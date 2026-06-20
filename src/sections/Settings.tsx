import { useEffect, useState } from 'react';
import { useCached } from '@possibl/rcrt-app-kit/core';
import { defineSection, defineAnchor, SectionPage } from '@possibl/rcrt-app-kit/shell';
import { Card, Button, Badge } from '@possibl/rcrt-app-kit/ui';
import { Settings as SettingsIcon } from 'lucide-react';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { WorkspaceSettings, SETTINGS_NAME, type WorkspaceSettingsContent } from '../lib/schemas';
import { clearSampleItems } from '../lib/sample-data';

// Settings shows a SINGLETON breadcrumb pattern: one `interpret:app-settings`
// row per workspace, read with useCached + `.query()[0]`, written idempotently
// with `.upsertByName(SETTINGS_NAME, …)`. Still no database — preferences are a
// breadcrumb like everything else.

const anchors = {
  prefs: defineAnchor({ label: 'Workspace preferences form' }),
  data: defineAnchor({ label: 'Sample-data controls' }),
};

const DEFAULTS: WorkspaceSettingsContent = { displayName: '', defaultStatus: 'open' };

function SettingsBody() {
  const client = getClient().forTenant(tenantId);
  const settings = useCached('settings:singleton', async () => (await WorkspaceSettings.query(client))[0] ?? null);
  const [draft, setDraft] = useState<WorkspaceSettingsContent>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hydrate the editable draft once the cached singleton arrives.
  useEffect(() => {
    if (settings.data) setDraft({ ...DEFAULTS, ...settings.data.content });
  }, [settings.data?.id]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    await WorkspaceSettings.upsertByName(client, {
      name: SETTINGS_NAME,
      title: 'Workspace settings',
      content: draft,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    void settings.refresh();
  };

  const clearSamples = async () => {
    if (clearing) return;
    setClearing(true);
    await clearSampleItems(client);
    setClearing(false);
  };

  return (
    <SectionPage title="Settings" subtitle="App configuration" cache={settings}>
      <anchors.prefs.Anchor style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
        <Card>
          <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '28rem' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--rcrt-muted-fg)' }}>Display name</span>
              <input
                className="rcrt-input"
                placeholder="e.g. Acme Operations"
                value={draft.displayName}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--rcrt-muted-fg)' }}>Default status for new items</span>
              <select
                className="rcrt-input"
                value={draft.defaultStatus}
                onChange={(e) => setDraft((d) => ({ ...d, defaultStatus: e.target.value as 'open' | 'done' }))}
              >
                <option value="open">open</option>
                <option value="done">done</option>
              </select>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button onClick={() => void save()} loading={saving}>
                Save settings
              </Button>
              {saved && <Badge tone="success">Saved</Badge>}
            </div>
          </div>
        </Card>
      </anchors.prefs.Anchor>

      <anchors.data.Anchor>
        <Card>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--rcrt-muted-fg)' }}>
            Connected to workspace <code>{tenantId}</code>. Demo rows are tagged so you can remove them
            without touching real data.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void clearSamples()} loading={clearing}>
            Clear sample data
          </Button>
        </Card>
      </anchors.data.Anchor>
    </SectionPage>
  );
}

export const settings = defineSection({
  id: 'settings',
  path: '/settings',
  label: 'Settings',
  icon: SettingsIcon,
  navSlot: 'bottom',
  description: 'App + workspace settings (persisted as a singleton breadcrumb), plus sample-data controls.',
  component: SettingsBody,
  anchors,
});
