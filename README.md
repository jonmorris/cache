# Cache

A one-list-at-a-time task pad that deletes itself.

Cache holds one list per day, across today and the seven days after it. Each
runs from a start to a deadline on its own day. Missing the deadline does not
destroy the list — it turns it **overdue**, which is a state worth seeing. The
list is swept away at 04:00 the next morning, finished or not. There is no
archive, no history and no streak to protect. A day with nothing on it is blank,
because that is the resting state.

Arrows at the top step between days, and the strip beneath them marks which days
already hold a list, so a plan made for Friday is visible from Tuesday without
walking there.

## The rules

| | |
| --- | --- |
| Lists | one per day, today to +7 |
| Tasks per list | up to 7 |
| Transit legs | uncapped — they do not spend a slot |
| Estimate per item | 5 or 10 minutes, then quarter-hours to 2 hours |
| Half done | available on items of 30 minutes or more |
| Day horizon | today to +7 days |
| Start | any time before the deadline, prefilled |
| Deadline | any time on that day, required |
| Overdue at | its deadline, to the second |
| Destroyed at | 04:00 the next morning |
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

## Tasks and transit

Every item is a **task** or a **transit** leg, picked when you add it and
defaulting to task. Transit is the getting between the work. It takes an
estimate, ticks off, halves, drags and deletes exactly as a task does, and its
time counts in every figure on the HUD — because it costs the day just the same.

The one difference is the cap: **transit does not spend one of the seven**. A
day with four things to do and three journeys between them is still a four-task
day, and capping the journeys would mean choosing between planning the travel
and planning the work at the end of it. So the seven stays the honest count of
what you took on.

Transit rows are set back — indented, quieter, led by an arrow — so the tasks
still read as the spine of the day and the journeys hang off it. In the progress
bar a transit segment keeps its full width, since one equal segment per item is
the whole premise, and is set back by height instead.

Once the seven tasks are used the add row stays live and offers transit rather
than going dead; the sheet refuses a task and says why. Editing an item can
change its kind, so a mis-picked row is corrected rather than deleted and
retyped — except promoting transit to a task when the seven are already used,
which is the one thing the cap has to refuse.

## The HUD

The HUD holds the whole situation: the two times, four figures, and the clock.
Work sits in the left column and time in the right. **Planned** against
**available** is what you took on against the hours you have; **to do** against
**slack** is what is left of each. On screen, available less to do is exactly
slack.

The two columns move independently, which is the point of showing both. Ticking
an item moves **to do** and leaves **available** alone; time passing moves
**available** and leaves **to do** alone. Available holds at the full window —
deadline less start — until the start goes by, and counts down to the deadline
thereafter.

There is deliberately no separate *window* figure. It is fixed at deadline less
start, so before work begins it reads exactly what available reads, and the
strip above already names both ends of it. Two cells showing one number is a
wasted cell, and the moments you are most likely to have the app open — setting
up tomorrow, planning tonight, checking before you start — are precisely the
ones where they would agree.

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

## Overdue

Passing the deadline used to delete the list. It no longer does. The list stays,
its items stay tickable, and an alert appears under the week selector naming the
deadline it missed and when it will be cleared:

```
OVERDUE · WAS DUE 18:00 · CLEARS WED 04:00
```

The panel turns terracotta and the clock stops counting down and starts counting
up — **late by**, rather than **time left**. Available floors at zero and the
pressure bar fills, because there is no time left to spend inside the window.

Overdue outranks the older *over* state. They are different claims: over is a
forecast that the work will not fit in the time left; overdue is the fact that
the time is gone. A list can pass through the first into the second, and once it
is late that is the thing worth saying.

Everything is still swept at **04:00 the next morning**, which is the rule
pre-deadline lists always used. Two consequences follow. A list now outlives its
own day by design, so between midnight and 04:00 it is off-screen — the
navigator starts at today — while still sitting in storage waiting to be
deleted. And lists written before deadlines existed cannot be seen overdue at
all: their deadline and their sweep are the same 04:00 moment, so they are gone
the instant they are late.

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
