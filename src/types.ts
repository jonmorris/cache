/** 0 not started, 0.5 half done, 1 done. Halves only on long enough items. */
export type Progress = 0 | 0.5 | 1;

export interface Item {
  id: string;
  name: string;
  /** Estimated duration in minutes. Always one of DURATIONS. */
  minutes: number;
  progress: Progress;
  createdAt: number;
}

/** Items at least this long can be marked half done. */
export const HALF_MIN = 30;

export const canHalve = (minutes: number) => minutes >= HALF_MIN;

/** Tapping cycles: long items through a half step, short ones straight to done. */
export function nextProgress(item: Pick<Item, 'minutes' | 'progress'>): Progress {
  if (!canHalve(item.minutes)) return item.progress === 1 ? 0 : 1;
  if (item.progress === 0) return 0.5;
  return item.progress === 0.5 ? 1 : 0;
}

/**
 * Reads progress from a stored or imported item. Accepts the older `done`
 * boolean, and refuses a half on an item too short to hold one.
 */
export function readProgress(raw: Record<string, unknown>, minutes: number): Progress {
  const value =
    typeof raw.progress === 'number' ? raw.progress : raw.done === true ? 1 : 0;
  if (value >= 1) return 1;
  if (value >= 0.5 && canHalve(minutes)) return 0.5;
  return 0;
}

export interface List {
  /** Local calendar day the list is for, as YYYY-MM-DD. Its storage key: one
   *  list per day, across today and the seven days after it. */
  date: string;
  /**
   * Local wall-clock time on `date` at which the list is destroyed, as HH:MM.
   * null only for lists written before deadlines existed; those keep the old
   * 4am-next-morning rule so no stored list or backup is stranded.
   */
  deadline: string | null;
  createdAt: number;
  items: Item[];
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  id: 'settings';
  theme: ThemeMode;
}

export interface Backup {
  app: 'cache';
  version: 2;
  exportedAt: string;
  lists: List[];
  settings: Settings;
}

export const APP_VERSION = '1.0.0';

export const MAX_ITEMS = 7;
export const MAX_DAYS_AHEAD = 7;

/** Two short options for quick jobs, then quarter-hours up to 2 hours. */
export const DURATIONS = [5, 10, 15, 30, 45, 60, 75, 90, 105, 120] as const;

export const DEFAULT_SETTINGS: Settings = { id: 'settings', theme: 'system' };
