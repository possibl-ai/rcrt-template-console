import { defineSection, SectionPage } from '@possibl/rcrt-app-kit/shell';
import { Card } from '@possibl/rcrt-app-kit/ui';
import { Settings as SettingsIcon } from 'lucide-react';
import { tenantId } from '../lib/firebase-config';

function SettingsBody() {
  return (
    <SectionPage title="Settings" subtitle="App configuration">
      <Card>
        <p style={{ margin: 0, color: 'var(--rcrt-muted-fg)' }}>
          Connected to workspace <code>{tenantId}</code>. Add your own integration
          settings here.
        </p>
      </Card>
    </SectionPage>
  );
}

export const settings = defineSection({
  id: 'settings',
  path: '/settings',
  label: 'Settings',
  icon: SettingsIcon,
  navSlot: 'bottom',
  description: 'App + workspace settings.',
  component: SettingsBody,
});
