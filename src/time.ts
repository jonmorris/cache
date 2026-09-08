import type { List } from './types';

/** The scheduling half of a list — all the date maths needs. */
type Schedule = Pick<List, 'date' | 'deadline'>;

/**
 * Fallback for lists written before deadlines existed: 04:00 on the morning
 * after the day the list was set for. Every list made now carries its own
 * deadline instead.
 */
export const LEGACY_EXPIRY_HOUR = 4;

/** Deadline used when a day is picked and the usual evening slot has gone. */
const PREFERRED_DEADLINE = '21:00';

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

/** Epoch ms of an HH:MM wall-clock time on the local day `iso`. */
export function timeOn(iso: string, hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = fromISODate(iso);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

/** Epoch ms at which the list is destroyed. */
export function expiresAt(list: Schedule): number {
  if (list.deadline) return timeOn(list.date, list.deadline);
  const d = fromISODate(list.date);
  d.setDate(d.getDate() + 1);
  d.setHours(LEGACY_EXPIRY_HOUR, 0, 0, 0);
  return d.getTime();
}

export function isExpired(list: Schedule, now: number = Date.now()): boolean {
  return now >= expiresAt(list);
}

/** "6:30 PM" from "18:30". */
export function clockLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${suffix}`;
}

/** What the header shows as the moment of destruction. */
export function deadlineLabel(list: Schedule): string {
  return list.deadline ? clockLabel(list.deadline) : expiryLabel(list);
}

/** Time remaining as a ticking clock: "04:12:38", or "2d 04:12:38" beyond a day. */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const clock = [
    pad(Math.floor((total % 86_400) / 3600)),
    pad(Math.floor((total % 3600) / 60)),
    pad(total % 60),
  ].join(':');
  return days > 0 ? `${days}d ${clock}` : clock;
}

/**
 * A deadline that is actually reachable: the usual evening slot, or the next
 * clear hour when that has already gone by on the chosen day.
 */
export function defaultDeadline(iso: string, now: number = Date.now()): string {
  if (timeOn(iso, PREFERRED_DEADLINE) > now + 60_000) return PREFERRED_DEADLINE;
  const next = new Date(now + 3_600_000);
  next.setMinutes(0, 0, 0);
  if (toISODate(next) !== iso) return '23:59';
  return `${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

/** A list set for a future day is visible but its items cannot be ticked off yet. */
export function isPending(list: Schedule, now: number = Date.now()): boolean {
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
export function expiryLabel(list: Schedule): string {
  const at = new Date(expiresAt(list));
  const h = at.getHours();
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${DAYS[at.getDay()]} ${h12}:${pad(at.getMinutes())} ${suffix}`;
}
