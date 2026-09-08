import {
  DEFAULT_SETTINGS,
  DURATIONS,
  MAX_ITEMS,
  type Backup,
  type Item,
  type List,
  type Settings,
  type ThemeMode,
} from './types';

export function buildBackup(lists: List[], settings: Settings): Backup {
  return { app: 'cache', version: 2, exportedAt: new Date().toISOString(), lists, settings };
}

export function download(backup: Backup) {
  const stamp = backup.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cache-backup-${stamp}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const nearestDuration = (n: unknown) => {
  const raw = typeof n === 'number' && Number.isFinite(n) ? n : 30;
  return DURATIONS.reduce((best, d) => (Math.abs(d - raw) < Math.abs(best - raw) ? d : best));
};

const THEMES: ThemeMode[] = ['system', 'light', 'dark'];

const hhmm = (v: unknown) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : null);

/**
 * Backup files are hand-editable and can come from an older version, so every
 * field is re-validated rather than trusted.
 */
export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  if (!isRecord(data) || data.app !== 'cache') throw new Error('Not a Cache backup file.');

  // v2 carries an array of lists; v1 files carry a single one under `list`.
  const raw: unknown[] = Array.isArray(data.lists)
    ? data.lists
    : isRecord(data.list)
      ? [data.list]
      : [];

  const seen = new Set<string>();
  const lists: List[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error('Backup contains a list with no valid date.');
    }
    // One list per day is the whole model; a duplicated day would overwrite.
    if (seen.has(entry.date)) continue;
    seen.add(entry.date);

    const items: Item[] = (Array.isArray(entry.items) ? entry.items : [])
      .filter(isRecord)
      .slice(0, MAX_ITEMS)
      .map((it) => ({
        id: typeof it.id === 'string' && it.id ? it.id : crypto.randomUUID(),
        name: String(it.name ?? '').slice(0, 120).trim() || 'Untitled',
        minutes: nearestDuration(it.minutes),
        done: it.done === true,
        doneAt: typeof it.doneAt === 'number' ? it.doneAt : it.done === true ? Date.now() : null,
        createdAt: typeof it.createdAt === 'number' ? it.createdAt : Date.now(),
      }));

    lists.push({
      date: entry.date,
      // Backups predating deadlines restore without one and keep the old
      // 4am-next-morning rule. A start, if the file has one, is now derived.
      deadline: hhmm(entry.deadline),
      createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now(),
      items,
    });
  }

  const theme = isRecord(data.settings) ? data.settings.theme : undefined;
  const settings: Settings = {
    id: 'settings',
    theme: THEMES.includes(theme as ThemeMode) ? (theme as ThemeMode) : DEFAULT_SETTINGS.theme,
  };

  return { app: 'cache', version: 2, exportedAt: String(data.exportedAt ?? ''), lists, settings };
}
