# Decisions

The reasoning for decisions that have no better home. Most of this project's
reasoning already lives in two places, and stays there:

- **`README.md`**, whose sections (*The rules*, *Timing an item*, *Tasks and
  transit*, *The HUD*, *Overdue*, *Notes for future me*) explain why the app
  behaves as it does.
- **Commit messages**, which carry the why for each change, including the
  reversals.

Write a section here only when neither fits: usually a decision about process
or tooling rather than the app. Repo-only; never built or shipped.

## Running records

Decisions are indexed in `docs/DECISION-LOG.md`, one dated line each, and told
as a story in `docs/CASE-STUDY.md`. The index is not a second source of truth:
each row points at the section, here, in the README or in a commit, that holds
the reasoning.

New entries go in as one file per decision in `docs/decision-log/`, never as an
edit to the table. Rows appended to the same last line by parallel branches
always conflict; separate files never do. `npm run decision-log -- --fold`
moves them into the table on the default branch, and `npm test` fails on a
malformed entry so the fold never meets one.

The checker is plain Node (`node:test`, no dependencies), matching
`scripts/generate-icons.mjs`: the repo had no test runner, and adding one for
a docs check would have been the larger change.
