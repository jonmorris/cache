# Cache

A one-list-at-a-time task pad that deletes itself.

Cache holds exactly one list. You set the day it is for — today, or up to seven
days out — and a deadline time on that day. At the deadline the list is
destroyed, finished or not, and a countdown runs until then. There is no
archive, no history and no streak to protect. The landing screen is blank
because that is the resting state.

## The rules

| | |
| --- | --- |
| Lists at once | 1 |
| Items per list | up to 7 |
| Estimate per item | 15 minutes to 2 hours, in 15-minute steps |
| Day horizon | today to +7 days |
| Deadline | any time on the chosen day, required |
| Destroyed at | its deadline, to the second |
| Storage | IndexedDB, on device, no account, no server, no sync |

**Estimated** is the sum of every item and never moves. **Remaining** is the sum
of the items still open. The progress bar has one equal segment per item, in list
order — tick the fourth thing first and the fourth segment fills, so the bar
shows *which* things are done rather than just how many.

Ticked items stay on the list, struck through and faded. Drag a row by its grip
to reorder it — the progress segments travel with their items, so the bar keeps
telling the truth. (Arrow keys work on a focused grip too.) A list set for a
future day is visible and editable, but its items cannot be ticked off until its
day arrives.

**Time left** counts down to the deadline. When the work still open no longer
fits before it, the countdown turns amber and says how far over you are; inside
the last fifteen minutes it turns red. Lists written before deadlines existed
keep the old 04:00-next-morning rule until you give them one.

## Install it on your phone

Open the site, then **Share → Add to Home Screen** (iOS) or **Install app**
(Android). It runs standalone and works with no connection.

## First-time setup

Two things must be done by hand, once. No workflow token can do either — the
Pages create endpoint refuses `GITHUB_TOKEN` with "Resource not accessible by
integration", verified on this repo.

1. The repository must be **public** (on a free plan).
2. **Settings → Pages → Source** must be set to **GitHub Actions**, not
   "Deploy from a branch".

Until step 2 is done every deploy fails at `actions/configure-pages` with
`Get Pages site failed ... Not Found`. Re-running does not help; the setting has
to change first.

## Deploying

Every push to the default branch runs `.github/workflows/deploy.yml`, which
builds and publishes to Pages. The site lives at
`https://<user>.github.io/cache/`; `base` in `vite.config.ts` must match that
repository name.

## Backups

Local-only data dies with a cleared cache. **Settings → Export JSON** writes the
current list and preferences to a file; **Import JSON** replaces what is on the
device with a backup, after a confirmation. Imported files are re-validated
field by field rather than trusted.

## Development

```sh
npm install
npm run dev        # generates icons, then serves on :5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the built app
npm run typecheck
```

## Notes for future me

**Bottom sheets render through a React portal on `document.body`.** iOS treats a
touch-scrolling container as a containing block for `position: fixed`, so a sheet
mounted inside a scrolling screen gets clipped by it and ends up behind the tab
bar. See `src/components/Sheet.tsx`.

**The icon set is generated, not committed.** `scripts/generate-icons.mjs` is a
hand-rolled PNG encoder over `node:zlib` — no image library — and runs from
`predev`/`prebuild`. `public/icons/` is gitignored.

**Reordering measures row geometry once, at drag start.** Reading rects per
pointer move would read back a layout the drag is itself shifting. See
`src/components/ItemList.tsx`.

**The service worker serves hashed assets cache-first and navigations
network-first**, falling back to the cached shell. Bump `VERSION` in
`public/sw.js` to force old caches out.

## Stack

React 19, Vite 7, TypeScript. No UI framework, no state library, no date library
— two runtime dependencies in total.
