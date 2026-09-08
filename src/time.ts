import type { List } from './types';

/**
 * A list dies at 04:00 on the morning after the day it was set for. "End of
 * day" in the human sense — a list you are still working through at 00:30
 * survives, and it is gone before you wake up.
 */
export const EXPIRY_HOUR = 4;

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD (never UTC — the user's day is the local one). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now: number = Date.now()): string {
  return toISODate(new Date(now));
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from today to `iso` (negative for past days). */
export function daysFromToday(iso: string, now: number = Date.now()): number {
  const a = fromISODate(todayISO(now)).getTime();
  const b = fromISODate(iso).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Epoch ms at which a list set for `iso` is deleted. */
export function expiresAt(iso: string): number {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + 1);
  d.setHours(EXPIRY_HOUR, 0, 0, 0);
  return d.getTime();
}

export function isExpired(list: List, now: number = Date.now()): boolean {
  return now >= expiresAt(list.date);
}

/** A list set for a future day is visible but its items cannot be ticked off yet. */
export function isPending(list: List, now: number = Date.now()): boolean {
  return daysFromToday(list.date, now) > 0;
}

/** "TODAY", "TOMORROW", "YESTERDAY", or "WED 10 SEP". */
export function dayLabel(iso: string, now: number = Date.now()): string {
  const delta = daysFromToday(iso, now);
  if (delta === 0) return 'TODAY';
  if (delta === 1) return 'TOMORROW';
  if (delta === -1) return 'YESTERDAY';
  return shortDate(iso);
}

/** Left column of the day picker: "TODAY", "TOMORROW", then a bare weekday. */
export function pickerName(iso: string, now: number = Date.now()): string {
  const delta = daysFromToday(iso, now);
  if (delta === 0) return 'TODAY';
  if (delta === 1) return 'TOMORROW';
  return DAYS[fromISODate(iso).getDay()];
}

/** "08 SEP" — pairs with pickerName without repeating the weekday. */
export function dayMonth(iso: string): string {
  const d = fromISODate(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** "MON 08 SEP" */
export function shortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${DAYS[d.getDay()]} ${pad(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** Ledger-style duration: 45 -> "0:45", 135 -> "2:15". */
export function duration(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
}

/** "TUE 4:00 AM" — when the list on screen disappears. */
export function expiryLabel(iso: string): string {
  const at = new Date(expiresAt(iso));
  const h = at.getHours();
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${DAYS[at.getDay()]} ${h12}:${pad(at.getMinutes())} ${suffix}`;
}
