import { defineApp } from '@possibl/rcrt-app-kit/shell';
import { home } from './sections/Home';
import { items } from './sections/Items';
import { settings } from './sections/Settings';
import { AdvisorChat } from './lib/advisor-chat';

// ─────────────────────────────────────────────────────────────────────────────
// THE APP — a Section Registry. This one declaration is the whole app surface:
// the kit's <RcrtApp> derives the router, nav rail, the interpret:ui-manifest
// (App Control contract), the advisor dock + spotlight, page-context grounding,
// form prefill plumbing and the cached-data chrome FROM IT. There is no shell,
// router, manifest, advisor wiring or SWR ceremony to hand-write — those are
// inherited from @possibl/rcrt-app-kit.
//
// To add a section: write a `defineSection(...)` (a domain component + its
// anchors/forms) in src/sections/, then add it to `sections` below. That's it.
// ─────────────────────────────────────────────────────────────────────────────

export const consoleApp = defineApp({
  name: 'rcrt-console',
  version: '0.1.0',
  branding: { productName: 'RCRT Console', byline: 'on RCRT' },
  sections: [home, items, settings],
  advisor: {
    agent: 'advisor',
    displayName: 'Advisor',
    tagline: 'sees this app · ⌘J',
    suggestions: ['What needs my attention?', 'Add an item for me'],
    // The advisor renders rich JIT-UI cards via @possibl/rcrt-ui's <Chat>.
    // Omit `renderChat` to use the kit's built-in minimal text chat instead.
    renderChat: (props) => <AdvisorChat {...props} />,
  },
});
