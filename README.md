# rcrt-template-console

A **kit-based** RCRT console app: a nav-rail console with sections, tabs,
data tables, forms and an inherited advisor — built on
[`@possibl/rcrt-app-kit`](https://github.com/possibl-ai/rcrt-v2/tree/development/packages/app-kit),
[`@possibl/rcrt-sdk`](https://github.com/possibl-ai/rcrt-v2/tree/development/packages/rcrt-sdk)
and [`@possibl/rcrt-ui`](https://github.com/possibl-ai/rcrt-v2/tree/development/packages/ui).

> **This directory is meant to be pushed to `possibl-ai/rcrt-template-console`
> and marked as a GitHub _template_ repository.** The platform's
> `project init-repo` clones it via the GitHub "generate from template" API.
> (The repo could not be created automatically; push this tree there and flip
> the "Template repository" switch in its settings.)

## The point: building an app is mostly UI and config

You do **not** hand-write a shell, router, `interpret:ui-manifest`, advisor
dock, page-context wiring or SWR caching. The kit derives all of that from one
declaration — the **Section Registry** in [`src/app.config.tsx`](src/app.config.tsx).
You author **an app definition** plus your **domain components**. That's it.

```
src/
  app.config.tsx        ← THE APP: defineApp({ sections, advisor, branding }) — pure config
  sections/
    Home.tsx            ← a dashboard section (stat cards + a delightful, actionable empty state)
    Items.tsx           ← a collection with tabs + a prefillable form + a nested record route
    ItemRecord.tsx      ← the record route body (/items/:id, full-bleed/chromeless)
    Settings.tsx        ← a persisted SINGLETON settings form (upsertByName) + sample-data controls
  lib/
    schemas.ts          ← defineSchema handles (your breadcrumb shapes) — no database
    sample-data.ts      ← copyable seed/clear pattern (so a new app looks alive on first load)
    api-client.ts       ← the one @possibl/rcrt-sdk client (auth seam)
    auth.tsx            ← Firebase TokenProvider (or API-key "key mode")
    cache.ts            ← the SWR snapshot store
    advisor-chat.tsx    ← @possibl/rcrt-ui <Chat> wired into the advisor dock
  App.tsx               ← auth gate + providers + <RcrtApp app={consoleApp} />
  main.tsx              ← entry: styles, widget registration, <AuthProvider>
AGENTS.md               ← builder-facing guide (TOUCH/CONFIG/LEAVE, ALWAYS/NEVER, recipes)
index.html, vite.config.ts, Dockerfile, nginx.conf, cloudbuild.yaml, .env  ← scaffold (never edited)
```

`app.config.tsx` is ~35 lines. The shell, manifest, advisor and caching it
inherits would be hundreds of lines of hand-wiring in a non-kit app.

## Add a section (the whole recipe)

1. Create `src/sections/MySection.tsx`:

   ```tsx
   import { defineSection, defineAnchor, SectionPage } from '@possibl/rcrt-app-kit/shell';
   import { useCached } from '@possibl/rcrt-app-kit/core';

   const anchors = { list: defineAnchor({ label: 'My list' }) };

   function MyBody() {
     const data = useCached('my:data', () => /* load breadcrumbs */);
     return (
       <SectionPage title="My section" cache={data}>
         <anchors.list.Anchor>{/* your UI */}</anchors.list.Anchor>
       </SectionPage>
     );
   }

   export const mySection = defineSection({
     id: 'mine', path: '/mine', label: 'Mine', navGroup: 'Workspace',
     description: 'What this section is (the advisor reads this).',
     component: MyBody, anchors,
   });
   ```

2. Add it to `sections` in [`src/app.config.tsx`](src/app.config.tsx).

That's the whole change. The router, nav entry, manifest route, advisor
grounding and page chrome appear automatically. **Never** hand-roll the shell,
router, manifest, advisor wiring, page-context effects or SWR — they are
inherited and any reimplementation will drift.

## What's automatic (never hand-write these)

| Concern | Inherited from |
|---|---|
| Router + nav rail | section `path`/`label`/`icon`/`navGroup`/`navSlot` |
| `interpret:ui-manifest` (App Control) | the registry, published hash-idempotently on boot |
| Advisor dock, spotlight, grounding tags, session persistence | `advisor` config |
| Page context (`{section}:{tab}`, async record resolvers) | the shell, on every location change |
| Form prefill consumption (advisor → form) | `defineForm` + `useAppForm` |
| Cache chrome (refresh, UpdatedAgo, error banner) | `SectionPage cache={…}` |
| Anchors as components (no string drift) | `defineAnchor` → `anchors.x.Anchor` |

This template demonstrates: a dashboard section, a collection with **tabs**
(`All`/`Open`/`Done`, mapped to `?tab=` by the shell) and a prefillable **form**,
a deep-linkable **record route** (`/items/:id`) that is a **chromeless**
full-bleed takeover, a persisted **singleton settings** form (`upsertByName`),
multi-block nav (`navSlot: top/bottom`), advisor **actions** in the manifest, and
the advisor rendered through `@possibl/rcrt-ui`'s `<Chat>`.

## Sample data (a new app should never open empty)

`src/lib/sample-data.ts` is the **copyable seeding pattern**: it creates a handful
of `interpret:item` breadcrumbs stamped with a marker tag (`sample:seed`), is
idempotent (won't double-seed), and is reached from an empty-state **"Load sample
data"** button on Home and Items (never auto-seeded on boot). `clearSampleItems`
removes only the marked rows. Copy this pattern for every new collection so the
dashboard and the advisor have real data to work with from the first render.

## App Control: how the `interpret:ui-manifest` publishes

`<RcrtApp>` publishes the manifest on boot, hash-idempotently, to
**`client.forTenant(VITE_TENANT_ID)`** — the workspace tenant. The manifest is
*derived* from the registry (routes + anchors + forms + `advisor.actions`), so to
change what the advisor can see or do, change `app.config.tsx` / the sections —
never hand-write a manifest. Publication is **client-side and lazy**: it happens
when the deployed app is opened in a browser with a valid `VITE_TENANT_ID` and
working auth. After deploy, **open (or preview) the app once** so the manifest
lands in the workspace tenant.

## Develop

```bash
npm install          # installs the three @possibl packages from vendor/*.tgz
cp .env.example .env.local   # set VITE_API_URL + VITE_TENANT_ID (+ key or Firebase)
npm run dev
npm run build        # tsc && vite build — must pass before deploy
```

### Auth modes

- **Key mode** (studio preview default): no Firebase configured →
  authenticated on load; the workspace API key (`VITE_RCRT_API_KEY`) is the token.
- **Firebase mode** (production): set `VITE_FIREBASE_*` → Google sign-in; the
  Firebase id token is the token. Auth lives entirely in `src/lib/auth.tsx`
  (the kit never touches the IdP); swap in Auth0/Clerk/etc. there.

## Theming

Neutral premium-dark by default. Rebrand by editing the `--rcrt-*` (and the
Tailwind `--*`) CSS variables in [`src/index.css`](src/index.css) — never by
forking kit components.

## Dependencies (vendored tarballs → registry)

`@possibl/rcrt-sdk`, `@possibl/rcrt-app-kit` and `@possibl/rcrt-ui` are installed
from `vendor/*.tgz` (`file:` deps) until they are published to npm. The
`Dockerfile` copies `vendor/` **before** `npm install` so the `file:` deps
resolve in Cloud Build (skipping this caused a deploy failure in the dogfood
console — see its commit `67ecc42`).

Current vendored versions: `@possibl/rcrt-app-kit@0.4.0`, `@possibl/rcrt-sdk@0.5.0`,
`@possibl/rcrt-ui@0.4.0` (aligned with the native template, which shares the same
app-kit + sdk).

**Once the packages are published**, in `package.json` replace each
`file:vendor/...tgz` with a registry semver range (e.g.
`"@possibl/rcrt-app-kit": "^0.4.0"`) and delete `vendor/`. Nothing else changes.

## Licence

MIT.
