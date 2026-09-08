# Cache

A one-list-at-a-time task pad that deletes itself.

Cache holds one list per day, across today and the seven days after it. Each
runs from a start to a deadline on its own day and is destroyed at that
deadline, finished or not. There is no
archive, no history and no streak to protect. A day with nothing on it is blank,
because that is the resting state.

Arrows at the top step between days, and the strip beneath them marks which days
already hold a list, so a plan made for Friday is visible from Tuesday without
walking there.

## The rules

| | |
| --- | --- |
| Lists | one per day, today to +7 |
| Items per list | up to 7 |
| Estimate per item | 5 or 10 minutes, then quarter-hours to 2 hours |
| Half done | available on items of 30 minutes or more |
| Day horizon | today to +7 days |
| Start | any time before the deadline, prefilled |
| Deadline | any time on that day, required |
| Destroyed at | its deadline, to the second |
| Storage | IndexedDB, on device, no account, no server, no sync |

**Estimated** is the sum of every item and never moves. **Remaining** is the sum
of the items still open. The progress bar has one equal segment per item, in list
order — tick the fourth thing first and the fourth segment fills, so the bar
shows *which* things are done rather than just how many.

Items of **30 minutes or more** take a half step: the box cycles empty, half
done, done. A half credits half the estimate, so **to do** and **slack** both
move by half the item, and its progress segment fills halfway.
Shorter items toggle straight to done. Re-estimating a half-done item below
thirty minutes drops the half rather than claiming the work is finished.

Ticked items stay on the list, struck through and faded. Drag a row by its grip
to reorder it — the progress segments travel with their items, so the bar keeps
telling the truth. (Arrow keys work on a focused grip too.) A list set for a
future day is visible and editable, but its items cannot be ticked off until its
day arrives.

The HUD holds the whole situation: the two times, five figures, and the clock.
The figures read as two pairs, work on the left and time on the right.
**Planned** against **window** is what you set out to do against the hours you
gave yourself — neither moves as you work, only as you edit the list or the
times. **To do** against
**available** is that same question now: the work still open against what is
left of the window. **Slack** is the difference between the second pair, and
runs the full width beneath them because it is what the rest add up to; on
screen, available less to do is exactly slack.

The two pairs move independently, which is the point of showing both. Ticking
an item moves **to do** and leaves **available** alone; time passing moves
**available** and leaves **to do** alone. Available holds at the full window
until the start goes by and counts down to the deadline thereafter, so before
you begin it reads the same as window — nothing has been spent yet.

Slack going negative turns the panel **terracotta** and says how far over you
are — that is the problem state, the work no longer fits. Amber is the lesser
signal: the deadline is inside fifteen minutes, which matters only if something
is still open. The bar shows how much of the time left the outstanding work
already claims: full means you are at the last moment you could start.

The clock counts down to the **start** while the start is still ahead, and to
the **deadline** once it has gone by, so the panel always answers the question
in front of you. Tapping the times strip edits both.

Clock times are 24-hour and durations are tabular, each in their own part of the
panel — mixing them in one right-aligned column is what made an earlier version
shift about whenever a value changed shape.

Lists written before deadlines existed keep the old 04:00-next-morning rule
until you give them one, and having no start they report no window. Those are
the only lists that can outlive their day; because the navigator spans today
onwards, such a list is off-screen for the few hours between midnight and 04:00,
though it is still in storage until it is deleted.

## Install it on your phone

Open the site, then **Share → Add to Home Screen** (iOS) or **Install app**
(Android), and launch it from the icon rather than the browser. It runs
standalone — no address bar, no toolbars — and works with no connection.

Installed on iOS the app fills the screen under a translucent status bar whose
text the system always draws white, so `body::before` keeps that strip dark
whatever the theme; on the light theme it would otherwise be white on cream.
The strip has height only where a safe-area inset exists, so it does not appear
in a browser tab.

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

Local-only data dies with a cleared cache. **Settings → Export JSON** writes
every stored day and your preferences to a file; **Import JSON** replaces what is on the
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

**Storage is at database version 2**, keyed by date. Version 1 kept a single
list at the fixed key `current`; the upgrade in `src/db.ts` carries it onto its
own day and drops the old store. `days.mjs` exercises that path against a real
v1 database.

**The service worker serves hashed assets cache-first and navigations
network-first**, falling back to the cached shell. Bump `VERSION` in
`public/sw.js` to force old caches out.

## Stack

React 19, Vite 7, TypeScript. No UI framework, no state library, no date library
— two runtime dependencies in total.
