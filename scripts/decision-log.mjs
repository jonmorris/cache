// Prints the pending decision-log entries, or with --fold appends them to
// docs/DECISION-LOG.md and deletes their files. Fold on the default branch,
// in a commit of its own.
//
//   npm run decision-log            validate and print the pending rows
//   npm run decision-log -- --fold  append them to the log and delete the files

import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { appendRows, readPending } from './decision-log-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'docs', 'decision-log');
const log = join(root, 'docs', 'DECISION-LOG.md');

let entries;
try {
  entries = readPending(dir);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (process.argv.includes('--fold')) {
  writeFileSync(log, appendRows(readFileSync(log, 'utf8'), entries.map((e) => e.row)));
  for (const entry of entries) unlinkSync(join(dir, entry.name));
  console.log(`Folded ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} into docs/DECISION-LOG.md.`);
} else {
  for (const entry of entries) console.log(entry.row);
  console.log(`${entries.length} pending ${entries.length === 1 ? 'entry' : 'entries'}.`);
}
