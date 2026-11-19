import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  appendRows,
  isEntryName,
  KINDS,
  parseEntry,
  readPending,
  sortByName,
} from './decision-log-lib.mjs';

const NAME = '2026-11-19-adopt-decision-log.md';
const ROW = '| 2026-11-19 | Process | Decisions logged as one file each | docs/DECISIONS.md → Running records |';

test('filename check', () => {
  assert.ok(isEntryName(NAME));
  assert.ok(isEntryName('2026-01-02-a.md'));
  assert.ok(isEntryName('2026-01-02-a1-b2-c3.md'));
  for (const bad of [
    'README.md',
    '2026-1-02-a.md',
    '2026-01-02.md',
    '2026-01-02-Upper.md',
    '2026-01-02-under_score.md',
    '2026-01-02-double--hyphen.md',
    '2026-01-02-trailing-.md',
    '2026-01-02-a.txt',
  ]) {
    assert.ok(!isEntryName(bad), bad);
  }
});

test('parses a valid entry, ignoring blank lines', () => {
  const entry = parseEntry(NAME, `\n${ROW}\n\n`);
  assert.deepEqual(entry, {
    name: NAME,
    date: '2026-11-19',
    kind: 'Process',
    decision: 'Decisions logged as one file each',
    ref: 'docs/DECISIONS.md → Running records',
    row: ROW,
  });
});

test('an escaped pipe stays inside its cell', () => {
  const entry = parseEntry(NAME, '| 2026-11-19 | Content | Kept "a \\| b" | git history |');
  assert.equal(entry.decision, 'Kept "a \\| b"');
});

test('every kind in the list is accepted', () => {
  for (const kind of KINDS) {
    assert.equal(parseEntry(NAME, `| 2026-11-19 | ${kind} | x | y |`).kind, kind);
  }
});

const rejects = (name, text, pattern) =>
  assert.throws(() => parseEntry(name, text), (error) => {
    assert.match(error.message, new RegExp(`^${name.replace(/\./g, '\\.')}: `));
    assert.match(error.message, pattern);
    return true;
  });

test('rejects malformed entries with the file and the problem named', () => {
  rejects('Bad.md', ROW, /name must be/);
  rejects(NAME, '', /exactly one non-blank line, found 0/);
  rejects(NAME, `${ROW}\n${ROW}`, /exactly one non-blank line, found 2/);
  rejects(NAME, ROW.slice(1), /start and end with \|/);
  rejects(NAME, ROW.slice(0, -1), /start and end with \|/);
  rejects(NAME, '| 2026-11-19 | Process | x |', /exactly four cells.*found 3/);
  rejects(NAME, '| 2026-11-19 | Process | x | y | z |', /exactly four cells.*found 5/);
  rejects(NAME, '| 2026-11-18 | Process | x | y |', /does not match the filename date 2026-11-19/);
  rejects(NAME, '| 2026-11-19 | Feature | x | y |', /Kind "Feature" is not one of/);
  rejects(NAME, '| 2026-11-19 | Process |  | y |', /Decision cell is empty/);
  rejects(NAME, '| 2026-11-19 | Process | x |  |', /Ref cell is empty/);
});

test('sorts by date, then name', () => {
  const names = ['2026-02-01-b.md', '2026-01-15-z.md', '2026-02-01-a.md'];
  assert.deepEqual(
    sortByName(names.map((name) => ({ name }))).map((e) => e.name),
    ['2026-01-15-z.md', '2026-02-01-a.md', '2026-02-01-b.md'],
  );
});

test('appends rows to the end of the Log table', () => {
  const log = [
    '# Log',
    '',
    '| Not | This |',
    '',
    '## Log',
    '',
    '| Date | Kind | Decision | Ref |',
    '| --- | --- | --- | --- |',
    '| 2026-01-01 | Product | old | x |',
    '',
  ].join('\n');
  const out = appendRows(log, ['| A |', '| B |']);
  assert.equal(
    out,
    [
      '# Log',
      '',
      '| Not | This |',
      '',
      '## Log',
      '',
      '| Date | Kind | Decision | Ref |',
      '| --- | --- | --- | --- |',
      '| 2026-01-01 | Product | old | x |',
      '| A |',
      '| B |',
      '',
    ].join('\n'),
  );
  assert.equal(appendRows(log, []), log);
});

test('refuses to append without a Log table', () => {
  assert.throws(() => appendRows('# Nothing here\n', ['| A |']), /no "## Log" heading/);
  assert.throws(() => appendRows('## Log\n\nprose only\n', ['| A |']), /no table under/);
});

// The real folder: a malformed entry fails the test run, and with it CI.
test('every pending entry in docs/decision-log is valid', () => {
  readPending(fileURLToPath(new URL('../docs/decision-log', import.meta.url)));
});
