import type { List } from './types';

/** The scheduling half of a list — all the date maths needs. */
type Schedule = Pick<List, 'date' | 'start' | 'deadline'>;

/**
 * Every list is destroyed at 04:00 on the morning after the day it was set
 * for — not at its own deadline. Passing the deadline makes a list overdue,
 * which is a state worth seeing; deleting the evidence at the moment you run
 * out of time is not.
 */
export const EXPIRY_HOUR = 4;

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

/** Epoch ms at which the list is destroyed: 04:00 the next morning, always. */
export function expiresAt(list: Schedule): number {
  const d = fromISODate(list.date);
  d.setDate(d.getDate() + 1);
  d.setHours(EXPIRY_HOUR, 0, 0, 0);
  return d.getTime();
}

export function isExpired(list: Schedule, now: number = Date.now()): boolean {
  return now >= expiresAt(list);
}

/**
 * Epoch ms the work is due by. Lists written before deadlines existed have
 * none, so for them the 04:00 sweep is both the deadline and the end — they
 * cannot be seen overdue, because they are gone the moment they are late.
 */
export function dueAt(list: Schedule): number {
  return list.deadline ? timeOn(list.date, list.deadline) : expiresAt(list);
}

/** Past the deadline but not yet swept away. */
export function isOverdue(list: Schedule, now: number = Date.now()): boolean {
  return now >= dueAt(list) && now < expiresAt(list);
}

/** Epoch ms when work is due to begin, or null on records with no start. */
export function startsAt(list: Schedule): number | null {
  return list.start ? timeOn(list.date, list.start) : null;
}

/**
 * Time actually usable between now and the deadline. Bounded below by the
 * start: hours before work begins are not hours that can be spent, which is
 * what keeps a list set for a later day from appearing to have every
 * intervening night to play with. Goes negative once the deadline is past —
 * the caller decides whether that reads as zero or as how far behind you are.
 */
export function availableMs(list: Schedule, now: number): number {
  const start = startsAt(list);
  return dueAt(list) - Math.max(now, start ?? now);
}

/** Work begins at the quarter hour already under way, or 09:00 on a later day. */
export function defaultStart(iso: string, now: number = Date.now()): string {
  if (iso !== todayISO(now)) return '09:00';
  const d = new Date(now);
  d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Signed duration, for a value that is meaningful in both directions. */
export function signedDuration(minutes: number): string {
  return (minutes < 0 ? '-' : '+') + duration(Math.abs(minutes));
}

/** What the HUD shows as the moment of destruction, 24-hour. */
export function deadlineLabel(list: Schedule): string {
  return list.deadline ?? expiryLabel(list);
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

/** "WED 04:00" — when the list is swept away, whatever its deadline was. */
export function expiryLabel(list: Schedule): string {
  const at = new Date(expiresAt(list));
  return `${DAYS[at.getDay()]} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
