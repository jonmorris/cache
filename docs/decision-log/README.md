# Pending decision-log entries

One file per decision, named `YYYY-MM-DD-short-name.md`, holding exactly one
row of the table in `../DECISION-LOG.md`. Add a file here instead of editing
that table, so parallel branches never conflict.

    npm run decision-log            # validate and print the pending rows
    npm run decision-log -- --fold  # append them to the log and delete the files

Fold on the default branch, in a commit of its own. See *How to keep this file*
in `../DECISION-LOG.md`.
