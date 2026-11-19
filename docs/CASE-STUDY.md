# Case study: Cache

A running, modular case study of Cache, a one-list-at-a-time task pad that
deletes itself, written for a portfolio. Repo-only: never built or shipped.

## How this file works

- **Modules, not chapters.** Each `##` section below stands alone, so a
  write-up can pick modules and drop the rest without leaving a gap. No module
  leans on one before it.
- **Every module opens with an italic tag line.**
  - **Core**: the spine of any version.
  - **Optional**: for the long form or a specific audience, named in brackets.
  - **Evidence**: what to show beside the text, with `[ ]` while it has not
    been captured and `[x]` once it has.
- **Running.** When work is worth telling, add or amend a module and add a row
  to *Log of additions* in the same commit. Facts and dates come from
  `docs/DECISION-LOG.md`; this file is where they become a story.
- **Placeholders** go in `[[double brackets]]` for the owner to fill in: role,
  tools, metrics, reflections. They are never invented.

## Suggested cuts

| Form | Modules |
| --- | --- |
| Short | 1, 2, 3, 8, 13 |
| Standard | 1, 2, 3, 4, 7, 8, 10, 13 |
| Long | 1–13 |

## 1. Overview

*Core · Evidence: [ ] the app on a phone, installed, mid-day with a part-done list*

Cache holds one list per day, for today and the seven days after it. Each list
runs from a start to a deadline. Missing the deadline turns the list overdue,
and at 04:00 the next morning it is swept away, finished or not. There is no
archive, no history and no streak.

- **Role:** [[your role: e.g. product owner and designer, directing an AI pair]]
- **Timeline:** the first build and 26 follow-up commits landed on 2026-09-08,
  and item timers followed on 2026-09-27. [[total time spent, if you want to
  state it]]
- **Platform:** an installable PWA, offline-capable, with all data in IndexedDB
  on the device.
- **Stack:** React 19, Vite 7 and TypeScript, with two runtime dependencies,
  deployed to GitHub Pages.
- **Tools:** Claude Code wrote the commits under your direction. [[other tools:
  design, devices tested on, anything else]]

## 2. The problem

*Core · Evidence: [ ] [[a screenshot or note of the list habit Cache replaces]]*

[[Why you built it, in your own words: what went wrong with the lists you kept
before.]]

What the repository itself argues is that a task list fails in two ways. It
accumulates: yesterday's leftovers become today's guilt, and the list stops
describing the day. And it says nothing about time: seven items is a different
day depending on whether they are seven emails or seven afternoons.

Cache answers the first by deletion and the second by estimates. Every item
carries one, from five minutes to two hours, and a list holds at most seven
tasks.

## 3. Reframing the brief

*Core · Evidence: [ ] the HUD before and after the start/deadline rework (commit be85c09)*

The first version was a self-deleting list with estimates. The turn came with
the start time (be85c09), whose commit puts it plainly: *"an estimate only means
something against the time available for it."* From then on the app was not a
list with numbers beside it but a comparison of work against hours: **planned**
against **available**, and **to do** against **extra**.

That reframing is why the readout became one panel (the HUD), why it shows
both columns, and why the two move independently: ticking an item moves *to
do*, and time passing moves *available*. The design problem was no longer how
to show a list. It was how to show whether the day still fits.

## 4. Deletion, and when to soften it

*Core · Evidence: [ ] the overdue alert, "OVERDUE · WAS DUE 18:00 · CLEARS WED 04:00"*

Deletion is the point of the app. The decision log shows its rule changing
twice in a day:

1. At first, a list was destroyed at 04:00 the morning after its day.
2. Then every list gained a deadline and was destroyed **at** it (ca9564b).
3. Then that was reversed (886e099). Missing a deadline now makes a list
   **overdue**: it stays, its items stay tickable, the clock counts up ("late
   by"), and the 04:00 sweep removes it.

The reversal's reasoning is the useful part. Over and overdue are different
claims: over is a forecast that the work will not fit, and overdue is the fact
that the time is gone. Deleting the evidence the moment you run out of time
removes the state most worth seeing. The fix also needed no special case for
older lists, because their deadline and their sweep are the same moment.

[[Your reflection: what made you change your mind, and whether it was use or
argument.]]

## 5. The start-time loop

*Optional [design-process audience] · Evidence: [ ] the four HUD states from commits be85c09, 6254ae5, dca48d5 and 0ed6888 side by side*

The start time changed four times in one day, and each step is on the record:

- **Required** (be85c09): a list runs from a start to a deadline, and hours
  before the start are not hours you can spend.
- **Derived** (6254ae5): setting a start was busywork, so the HUD showed START
  BY, the latest moment you could begin and still finish.
- **Restored** (dca48d5): a set start came back, prefilled so the common case
  stays two taps, alongside a WINDOW figure.
- **Window dropped** (0ed6888): *available* had since been added, and before
  work begins the two read the same number. That is exactly when the app is
  most likely to be open. Across five scenarios they agreed in three.

The lesson the commits draw is that a figure has to carry something unique at
the moment you look at it. Two cells showing one number is a wasted cell.

## 6. A HUD that holds still

*Optional [visual / front-end design audience] · Evidence: [ ] the HUD in ok, soon, over and overdue states; [ ] the iOS status-bar strip on the light theme*

- **Times and durations are kept apart.** Clock times sit in their own strip
  and durations in their own grid. Mixing them in one right-aligned column made
  values jump about as they changed shape, and the AM/PM suffix was the worst
  of it. Times went 24-hour so every glyph is the same width.
- **Colour has a ranking.** Terracotta means the problem: over, or overdue.
  Amber is the lesser nudge, a deadline within fifteen minutes, which only
  matters if something is still open (b7a4d12).
- **Installed is a real target.** On iOS the status bar's text is always white,
  which is unreadable on the light theme's cream. A strip the height of the
  safe-area inset keeps that band dark, and it has no height in a browser tab.
- **The icon was simplified.** A C over a progress bar became a single centred
  C, legible down to 16px, then was inverted to dark on green so it does not
  vanish into a dark wallpaper (0d66498, 4e957c1).

## 7. Seven tasks, uncapped transit

*Core · Evidence: [ ] a list with seven tasks and transit legs between them; [ ] the sheet refusing an eighth task*

Seven tasks is the cap, and it makes a list a choice rather than a dump. Then
the cap met travel. A day with four things to do and three journeys between
them is still a four-task day, and capping the journeys would mean choosing
between planning the travel and planning the work at the end of it.

So transit legs (3b07cbc) carry estimates, tick off and count in every figure,
but do not spend one of the seven. They are set back visually so the tasks stay
the spine of the day. The set-back starts at the tick, so grip and delete keep
one column on every row (4db9a1d). The add row never goes dead: once the
seven are used it offers transit, and the sheet is what refuses an eighth task
and says why.

The cap change reached code that was easy to miss. A backup import that
trimmed with a flat slice of seven would have silently dropped every transit
leg, and now counts tasks instead.

## 8. Partial credit: halves, then timers

*Core · Evidence: [ ] a long item at [/] with its segment half filled; [ ] a timed row reading 2:16/2:00*

Ticking things off in whole items lies about long work. A three-hour job
three-quarters done reads as three hours still to do, so you always look
behind.

The first answer was a half step (e362979). Items of thirty minutes or more
cycle empty, half, done, and a half credits half the estimate. Items under
thirty minutes skip it, since half of five minutes is not worth a tap.

The second was timers (e0139fc). An item can be started and stopped like a
stopwatch, and a running timer credits its share of the estimate continuously,
so *to do* and the progress segment wear down as you work. Two rules keep it
honest:

- Past halfway the box shows half by itself, and the next tap finishes the
  item rather than stepping to half again.
- Reaching the estimate **never** completes the item. Work runs long and timers
  get forgotten, so the final tick is always the person's.

[[Did the timer change how you plan? A before/after day would make this module.]]

## 9. Local-first and small

*Optional [engineering audience] · Evidence: [ ] the v1→v2 upgrade path in src/db.ts; [ ] a backup file and the import refusing a junk one*

- **No account, server or sync.** Everything is in IndexedDB. Since
  local-only data dies with a cleared cache, a JSON export/import is the
  backup, and imports are re-validated field by field.
- **Schema changes are carried forward, not stranded.** Storage moved to v2
  keyed by date, and the upgrade carries the old single list onto its own day.
  Item-shape changes (done → progress, kinds, timers) are read forward at load,
  because a list lives at most eight days and the next edit writes the new
  shape back.
- **Two runtime dependencies.** There is no UI framework, state library or
  date library, and the icon set comes from a hand-rolled PNG encoder over
  `node:zlib`.
- **Platform traps, written down.** Bottom sheets render through a portal
  because iOS clips fixed elements inside scrolling containers. The Pages site
  has to be created by hand: an attempt to automate it was reverted when
  GITHUB_TOKEN was refused, and the README records the evidence.

## 10. Saying no on the record

*Core · Evidence: [ ] the Declined and Reversed rows of DECISION-LOG.md*

Much of Cache is defined by what it refuses, and the decision log keeps those
refusals as rows (kind **Declined**) so they are not re-argued:

- no archive, history or streak
- no account, server or sync
- no UI framework, state library or date library

Reversals are kept the same way (kind **Reversed**), with the old row left in
place: destroy-at-deadline, the derived start, the window figure, and automatic
Pages setup. Removing things counted as much as adding them. The window figure,
the locked banner and the kind descriptions under the picker each went because
they repeated something already on screen.

## 11. Quality

*Optional [engineering audience] · Evidence: [ ] the headless-browser suites, which are not committed to this repo [[link or attach them if you have them]]*

Each change was verified by driving the built app in headless Chromium at
390×844 on a faked clock. The commits record the suites growing from 73 checks
across five suites (be85c09) to 268 across ten (c789c7a), plus a sixteen-step
walkthrough.

What stands out is checks built to catch a specific regression, and shown to
catch it:

- A countdown that rendered as a solid block when over got a readability
  check. Putting the original rule back made that check fail with the reported
  symptom (63d5e7a).
- A class name shared by two pickers broke the theme control while every suite
  passed, because they clicked by text and never measured. A check now measures
  it (b193aeb).
- Two suites used the wall clock and began failing at their own hardcoded
  deadlines. One now pins its clock. The other cannot, because it tests the
  real one-second tick, so it derives its deadline instead (0ed6888, c789c7a).

[[Anything on device testing: which phones, installed or in a browser.]]

## 12. Working with an AI collaborator

*Optional [AI-workflow audience] · Evidence: [ ] a commit message alongside the request that produced it; [ ] CLAUDE.md*

The commits were written by Claude through Claude Code sessions, and the owner
directed the work and merged it. `CLAUDE.md` sets the terms: think before
coding, prefer the simplest thing, keep changes surgical, and drive to a
verifiable goal. The commit messages show the result: each states the why,
names the trade-off and lists what was verified, which is what made this case
study possible to write from the history alone.

[[How you split the work: what you decided, what you delegated, where you
pushed back. A specific example would carry this module.]]

## 13. Outcome and reflection

*Core · Evidence: [ ] [[usage evidence: how long you have used it, a typical day]]*

[[Outcome: whether you use it, for how long, and what changed.]]

[[Metrics, if any: days planned, lists finished before the deadline, anything
you tracked.]]

[[Reflection: what you would do differently, and what you would keep.]]

## Log of additions

| Date | Module | Change |
| --- | --- | --- |
| 2026-11-19 | 1–13 | Initial draft from the git history, README and DECISION-LOG.md |
