export interface Item {
  id: string;
  name: string;
  /** Estimated duration in minutes. Always one of DURATIONS. */
  minutes: number;
  done: boolean;
  doneAt: number | null;
  createdAt: number;
}

export interface List {
  /** Only ever one list, so the record is a singleton. */
  id: 'current';
  /** Local calendar day the list is for, as YYYY-MM-DD. */
  date: string;
  /**
   * Local wall-clock time on `date` when work begins, as HH:MM. With the
   * deadline it forms the window the estimate has to fit into. May be in the
   * past — you can already be underway. null only for records written before
   * start times existed.
   */
  start: string | null;
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
  version: 1;
  exportedAt: string;
  list: List | null;
  settings: Settings;
}

export const APP_VERSION = '1.0.0';

export const MAX_ITEMS = 7;
export const MAX_DAYS_AHEAD = 7;

/** 15-minute steps from 15 minutes to 2 hours. */
export const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120] as const;

export const DEFAULT_SETTINGS: Settings = { id: 'settings', theme: 'system' };
