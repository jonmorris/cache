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

export function buildBackup(list: List | null, settings: Settings): Backup {
  return { app: 'cache', version: 1, exportedAt: new Date().toISOString(), list, settings };
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

  let list: List | null = null;
  if (isRecord(data.list)) {
    const raw = data.list;
    if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
      throw new Error('Backup contains a list with no valid date.');
    }
    const items: Item[] = (Array.isArray(raw.items) ? raw.items : [])
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
    list = {
      id: 'current',
      date: raw.date,
      // Backups predating these fields restore without them: no window, and the
      // old 4am-next-morning rule.
      start: hhmm(raw.start),
      deadline: hhmm(raw.deadline),
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
      items,
    };
  }

  const theme = isRecord(data.settings) ? data.settings.theme : undefined;
  const settings: Settings = {
    id: 'settings',
    theme: THEMES.includes(theme as ThemeMode) ? (theme as ThemeMode) : DEFAULT_SETTINGS.theme,
  };

  return { app: 'cache', version: 1, exportedAt: String(data.exportedAt ?? ''), list, settings };
}
