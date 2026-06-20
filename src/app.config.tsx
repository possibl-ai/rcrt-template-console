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

// Brand mark for the nav header — pure token-driven CSS (uses --rcrt-gradient),
// so rebranding is a token edit in src/index.css, never a component fork.
const BrandLogo = (
  <div
    aria-hidden
    style={{
      width: '1.75rem',
      height: '1.75rem',
      borderRadius: '0.5rem',
      background: 'var(--rcrt-gradient, var(--rcrt-accent))',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--rcrt-accent-fg, #fff)',
      fontWeight: 700,
      fontSize: '0.9rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}
  >
    R
  </div>
);

export const consoleApp = defineApp({
  name: 'rcrt-console',
  version: '0.1.0',
  branding: { productName: 'RCRT Console', byline: 'on RCRT', logo: BrandLogo },
  sections: [home, items, settings],
  advisor: {
    agent: 'advisor',
    displayName: 'Advisor',
    tagline: 'sees this app · ⌘J',
    // Self-provision a paired marketplace bundle when the advisor agent is
    // missing from the active workspace. Set this to your app's advisor bundle
    // once it exists; leave commented to assume the agent is already installed.
    // bundle: { scope: 'platform', name: 'rcrt-console-advisor' },
    suggestions: ['What needs my attention?', 'Add an item for me', 'Mark everything done'],
    // App-control ACTIONS are serialised into interpret:ui-manifest so the
    // advisor knows what it may DO (not just navigate). Each maps to a workspace
    // tool; `approval: 'user'` means the human confirms before it runs. The tool
    // (e.g. `item-act`) is implemented platform-side in the paired bundle — the
    // app only DECLARES the action surface so the manifest is complete.
    actions: [
      {
        name: 'create_item',
        tool: 'item-act',
        approval: 'user',
        description: 'Create a work item. Prefer prefilling the "items.new-item" form so the user confirms.',
      },
    ],
    // The advisor renders rich JIT-UI cards via @possibl/rcrt-ui's <Chat>.
    // Omit `renderChat` to use the kit's built-in minimal text chat instead.
    renderChat: (props) => <AdvisorChat {...props} />,
  },
});
