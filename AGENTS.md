# AGENTS.md — building on rcrt-template-console

You are extending a **kit-based RCRT web console**. The shell, router,
`interpret:ui-manifest`, advisor dock + spotlight, page-context grounding and
SWR caching are all **inherited from `@possibl/rcrt-app-kit`** and **derived
from one declaration** — the Section Registry in `src/app.config.tsx`. Your job
is to author the app definition and the domain section components. Nothing else.

## File map — TOUCH / CONFIG / LEAVE

```
src/
  app.config.tsx     CONFIG  the whole app surface: defineApp({ sections, advisor, branding })
  sections/          TOUCH   one file per section = a domain component + its anchors/forms
    Home.tsx                 dashboard (stat cards + delightful empty state w/ sample-data CTA)
    Items.tsx                collection: tabs + DataTable + a prefillable form + a record route
    ItemRecord.tsx           record-route body (/items/:id, chromeless full-bleed)
    Settings.tsx             persisted SINGLETON settings (upsertByName) + sample-data controls
  lib/
    schemas.ts       CONFIG  defineSchema handles (your breadcrumb shapes) — NO database
    sample-data.ts   CONFIG  copyable seed/clear pattern (see "Sample data" below)
    api-client.ts    LEAVE   the one @possibl/rcrt-sdk client (auth seam)
    auth.tsx         LEAVE   Firebase / API-key TokenProvider
    firebase-config.ts LEAVE VITE_* config (apiUrl, tenantId, apiKey, firebase)
    cache.ts         LEAVE   SWR snapshot store
    advisor-chat.tsx LEAVE   @possibl/rcrt-ui <Chat> wired into advisor.renderChat
    index.css        CONFIG  brand here — edit --rcrt-* / Tailwind tokens (never fork kit components)
  App.tsx / main.tsx LEAVE   auth gate + providers + <RcrtApp app={consoleApp} />
index.html, vite.config.ts, tailwind.config.js, tsconfig*.json   LEAVE  scaffold
Dockerfile, nginx.conf, cloudbuild.yaml, .env.example            LEAVE  deploy scaffold
vendor/*.tgz         LEAVE   the @possibl/* tarballs — the Dockerfile COPYs them BEFORE npm install
```

## ALWAYS

- Import from `@possibl/rcrt-app-kit/{shell,core,ui}` and `@possibl/rcrt-ui`.
  They ARE installed (vendored tarballs). Use them.
- Persist with `defineSchema` handles (`Thing.query/.create/.patch/.upsertByName`)
  against a tenant-bound client: `getClient().forTenant(tenantId)`. The tag IS
  the table.
- Render every section body inside `<SectionPage cache={useCached(...)}>` so it
  gets refresh + UpdatedAgo + error chrome for free.
- Reference anchors as components: `anchors.x.Anchor` (a `defineAnchor` handle).
  **Never** write `data-guide="..."` strings.
- Give forms structured semantics: `intent`, `entity`, and `distinguishFrom`
  (not free prose) so the advisor disambiguates which form to open. Consume
  prefills with `useAppForm(form)`.
- Brand by editing `--rcrt-*` tokens in `src/index.css` and the native theme
  equivalents — token edits only.
- Make empty + loading states excellent. Use `SkeletonPanel` while loading and
  `EmptyState` with a primary CTA (often "Load sample data") when empty.

## NEVER

- Never hand-roll a shell, router, `interpret:ui-manifest`, advisor dock/bus,
  page-context `useEffect`s, or SWR. They are inherited; any reimplementation
  drifts from the registry and is a bug.
- Never add a database, REST API, or custom auth. Persistence is breadcrumbs;
  auth is the seam in `src/lib/auth.tsx`.
- Never fork a kit component to restyle it — change tokens instead.
- Never delete `vendor/` or rewrite the `@possibl/*` deps to npm semver — they
  are not published yet, and the **Dockerfile COPYs `vendor/` before
  `npm install`** so the `file:` deps resolve in Cloud Build. Removing either
  breaks the deploy.

## Add a section (the whole recipe)

1. Create `src/sections/MySection.tsx`:

```tsx
import { defineSection, defineAnchor, SectionPage } from '@possibl/rcrt-app-kit/shell';
import { useCached } from '@possibl/rcrt-app-kit/core';
import { getClient } from '../lib/api-client';
import { tenantId } from '../lib/firebase-config';
import { Thing } from '../lib/schemas';

const anchors = { list: defineAnchor({ label: 'Things list' }) };

function MyBody() {
  const things = useCached('mine:things', () => Thing.query(getClient().forTenant(tenantId)));
  return (
    <SectionPage title="Mine" cache={things}>
      <anchors.list.Anchor>{/* render things.data */}</anchors.list.Anchor>
    </SectionPage>
  );
}

export const mySection = defineSection({
  id: 'mine', path: '/mine', label: 'Mine', navGroup: 'Workspace',
  description: 'What this section is — the advisor reads this.',
  component: MyBody, anchors,
});
```

2. Add `mySection` to `sections` in `src/app.config.tsx`. Done — route, nav
   entry, manifest entry, advisor grounding and page chrome all appear.

## Sample data (make the app look alive — and pass evals)

A new app should not open to a dead screen, and the advisor needs real
breadcrumbs to reason over. `src/lib/sample-data.ts` is the copyable pattern:

```ts
// 1) tag seeds with a known marker so they're findable/removable
export const SAMPLE_TAG = 'sample:seed';                 // in schemas.ts

// 2) create rows via the schema handle, stamping the marker tag
await Item.create(client, { name, title, content, tags: [SAMPLE_TAG] });

// 3) idempotent: skip if any sample row already exists
const already = await Item.query(client, { tags: [SAMPLE_TAG], limit: 1 });
if (already.length) return 0;
```

Wire seeding to an **empty-state button** ("Load sample data") — never auto-seed
on boot. When you add a new collection, add a matching `seed*`/`clear*` pair and
surface it the same way.

## interpret:ui-manifest (App Control) — how it publishes

`<RcrtApp>` publishes the manifest on boot via
`ensureManifestPublished(client, tenantId, app)` → it writes (hash-idempotently)
to **`client.forTenant(VITE_TENANT_ID)`**, i.e. the workspace tenant. This is
**client-side and lazy**: it only happens when the deployed app is opened in a
browser with a valid `VITE_TENANT_ID` and working auth (key mode needs a valid
`VITE_RCRT_API_KEY`). So:

- Keep the auth gate working and `VITE_TENANT_ID` correct — the manifest follows
  from those.
- Declared `sections`, `anchors`, `forms` and `advisor.actions` ARE the
  manifest. To change what the advisor can see/do, change the registry — never
  hand-write a manifest breadcrumb.
- After deploy, **open the app once** (or preview it) so the manifest publishes
  to the workspace tenant. An eval that checks the tenant without ever loading
  the app will see no manifest — that is expected for a never-opened SPA.

## Build / deploy

- `npm run build` runs `tsc && vite build`. Your code MUST typecheck or the
  Cloud Run deploy fails.
- The platform builds the app's own `Dockerfile` (node:20-alpine → static nginx);
  `cloudbuild.yaml` is incidental.
