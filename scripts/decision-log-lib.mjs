// Pending decision-log entries: one file per decision in docs/decision-log/,
// each holding a single table row, folded into docs/DECISION-LOG.md on the
// default branch. Separate files are what let parallel branches add decisions
// without conflicting on the table's last line.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The one list of kinds. DECISION-LOG.md describes them; this enforces them. */
export const KINDS = ['Product', 'Design', 'Content', 'Engineering', 'Process', 'Declined', 'Reversed'];

export const FILENAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;

/** The folder's own README, which is not an entry. */
export const README = 'README.md';

export const isEntryName = (name) => FILENAME.test(name);

/**
 * Parses one entry file into its row. Throws with the file named and the
 * problem stated, so a failing check says what to fix.
 */
export function parseEntry(name, text) {
  const fail = (problem) => {
    throw new Error(`${name}: ${problem}`);
  };
  if (!isEntryName(name)) fail('name must be YYYY-MM-DD-short-name.md, lowercase and hyphenated');

  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length !== 1) fail(`must hold exactly one non-blank line, found ${lines.length}`);

  const row = lines[0].trim();
  if (!row.startsWith('|') || !row.endsWith('|')) fail('row must start and end with |');

  // An escaped \| is text inside a cell, not a cell boundary.
  const cells = row.slice(1, -1).split(/(?<!\\)\|/).map((cell) => cell.trim());
  if (cells.length !== 4) fail(`row must have exactly four cells (Date, Kind, Decision, Ref), found ${cells.length}`);

  const [date, kind, decision, ref] = cells;
  if (date !== name.slice(0, 10)) fail(`Date cell "${date}" does not match the filename date ${name.slice(0, 10)}`);
  if (!KINDS.includes(kind)) fail(`Kind "${kind}" is not one of ${KINDS.join(', ')}`);
  if (!decision) fail('Decision cell is empty');
  if (!ref) fail('Ref cell is empty');

  return { name, date, kind, decision, ref, row };
}

/** Filename order: date first, then name, which is plain string order here. */
export const sortByName = (entries) =>
  [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

/**
 * Appends rows to the end of the table under `## Log`. Throws if there is no
 * such table, rather than guessing where the rows belong.
 */
export function appendRows(logText, rows) {
  if (rows.length === 0) return logText;
  const lines = logText.split('\n');
  const heading = lines.findIndex((line) => line.trim() === '## Log');
  if (heading === -1) throw new Error('DECISION-LOG.md has no "## Log" heading');

  const first = lines.findIndex((line, i) => i > heading && line.trim().startsWith('|'));
  if (first === -1) throw new Error('DECISION-LOG.md has no table under "## Log"');

  let last = first;
  while (last + 1 < lines.length && lines[last + 1].trim().startsWith('|')) last++;

  lines.splice(last + 1, 0, ...rows);
  return lines.join('\n');
}

/**
 * Every pending entry in `dir`, validated and in filename order. Collects all
 * the problems before throwing, so one run reports every bad file.
 */
export function readPending(dir) {
  const entries = [];
  const problems = [];
  for (const name of readdirSync(dir)) {
    if (name === README) continue;
    try {
      entries.push(parseEntry(name, readFileSync(join(dir, name), 'utf8')));
    } catch (error) {
      problems.push(error.message);
    }
  }
  if (problems.length > 0) throw new Error(problems.join('\n'));
  return sortByName(entries);
}
