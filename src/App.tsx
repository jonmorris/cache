import { useCallback, useEffect, useRef, useState } from 'react';
import { TabBar, type Tab } from './components/TabBar';
import { ListScreen } from './screens/ListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import * as db from './db';
import { addDays, expiresAt, todayISO } from './time';
import {
  DEFAULT_SETTINGS,
  MAX_DAYS_AHEAD,
  MAX_ITEMS,
  type Backup,
  type Item,
  type List,
  type Settings,
  type ThemeMode,
} from './types';

const THEME_COLOR = { light: '#f2efe7', dark: '#0b0b0c' };

/** Lists keyed by the day they are for. */
type Lists = Record<string, List>;

export function App() {
  const [tab, setTab] = useState<Tab>('list');
  const [lists, setLists] = useState<Lists>({});
  const [cursor, setCursor] = useState(() => todayISO());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const persisted = useRef<Lists>({});

  useEffect(() => {
    Promise.all([db.getLists(), db.getSettings()])
      .then(([stored, storedSettings]) => {
        // Seed the persisted snapshot too, so the write effect below sees
        // nothing changed and does not immediately rewrite what it just read.
        persisted.current = stored;
        setLists(stored);
        setSettings(storedSettings);
      })
      .catch(() => {
        /* first run, or storage blocked — fall through to the empty state */
      })
      .finally(() => setReady(true));
  }, []);

  /* Screen-level clock: day rollover, pending -> live, expiry. Coarse on
     purpose — the second hand belongs to <Hud>, so the whole tree is not
     re-rendering underneath an open sheet once a second. Paused when hidden. */
  useEffect(() => {
    let timer: number | undefined;
    const bump = () => setNow(Date.now());
    const stop = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      stop();
      if (document.visibilityState !== 'visible') return;
      bump();
      timer = window.setInterval(bump, 10_000);
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', bump);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', bump);
    };
  }, []);

  /* Land on the next deadline itself rather than up to a poll late. */
  useEffect(() => {
    const upcoming = Object.values(lists)
      .map(expiresAt)
      .filter((at) => at > Date.now());
    if (upcoming.length === 0) return;
    const delay = Math.min(...upcoming) - Date.now();
    if (delay > 2_147_483_000) return;
    const timer = setTimeout(() => setNow(Date.now()), delay + 200);
    return () => clearTimeout(timer);
  }, [lists]);

  /* The whole point of the app: each list deletes itself at its deadline. */
  useEffect(() => {
    if (!ready) return;
    const dead = Object.values(lists).filter((list) => now >= expiresAt(list));
    if (dead.length === 0) return;
    setLists((current) => {
      const next = { ...current };
      for (const list of dead) delete next[list.date];
      return next;
    });
  }, [ready, lists, now]);

  /* Keep the viewed day inside today..+7 as the days roll over. */
  useEffect(() => {
    const today = todayISO(now);
    const last = addDays(today, MAX_DAYS_AHEAD);
    if (cursor < today) setCursor(today);
    else if (cursor > last) setCursor(last);
  }, [now, cursor]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.theme]);

  /* Single write path: whatever changed in `lists` is what reaches disk. */
  useEffect(() => {
    if (!ready) return;
    const before = persisted.current;
    for (const [date, list] of Object.entries(lists)) {
      // Storage can be blocked outright (private mode, locked-down browser);
      // the app still works for the session, it just will not survive a reload.
      if (before[date] !== list) void db.putList(list).catch(() => {});
    }
    for (const date of Object.keys(before)) {
      if (!lists[date]) void db.deleteList(date).catch(() => {});
    }
    persisted.current = lists;
  }, [ready, lists]);

  const update = useCallback((date: string, fn: (current: List) => List) => {
    setLists((current) => (current[date] ? { ...current, [date]: fn(current[date]) } : current));
  }, []);

  const saveSettings = useCallback((next: Settings) => {
    setSettings(next);
    void db.putSettings(next).catch(() => {});
  }, []);

  const list = lists[cursor] ?? null;

  const onSchedule = (deadline: string) =>
    setLists((current) => ({
      ...current,
      [cursor]: current[cursor]
        ? { ...current[cursor], deadline }
        : { date: cursor, deadline, createdAt: Date.now(), items: [] },
    }));

  const onDiscard = () =>
    setLists((current) => {
      const next = { ...current };
      delete next[cursor];
      return next;
    });

  const onAddItem = (name: string, minutes: number) => {
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      minutes,
      done: false,
      doneAt: null,
      createdAt: Date.now(),
    };
    update(cursor, (current) =>
      current.items.length >= MAX_ITEMS
        ? current
        : { ...current, items: [...current.items, item] },
    );
  };

  const mapItems = (current: List, fn: (item: Item) => Item): List => ({
    ...current,
    items: current.items.map(fn),
  });

  const onSaveItem = (id: string, name: string, minutes: number) =>
    update(cursor, (current) => mapItems(current, (i) => (i.id === id ? { ...i, name, minutes } : i)));

  const onToggleItem = (id: string) => {
    const at = Date.now();
    update(cursor, (current) =>
      mapItems(current, (i) =>
        i.id === id ? { ...i, done: !i.done, doneAt: i.done ? null : at } : i,
      ),
    );
  };

  const onDeleteItem = (id: string) =>
    update(cursor, (current) => ({ ...current, items: current.items.filter((i) => i.id !== id) }));

  const onReorder = (from: number, to: number) =>
    update(cursor, (current) => {
      const items = [...current.items];
      items.splice(to, 0, ...items.splice(from, 1));
      return { ...current, items };
    });

  const onRestore = (backup: Backup) => {
    saveSettings(backup.settings);
    setLists(Object.fromEntries(backup.lists.map((l) => [l.date, l])));
    setCursor(todayISO());
    setTab('list');
  };

  return (
    <div className="app">
      <main className="screen">
        {!ready ? null : tab === 'list' ? (
          <ListScreen
            list={list}
            date={cursor}
            now={now}
            planned={new Set(Object.keys(lists))}
            onPickDay={setCursor}
            onSchedule={onSchedule}
            onDiscard={onDiscard}
            onAddItem={onAddItem}
            onSaveItem={onSaveItem}
            onToggleItem={onToggleItem}
            onDeleteItem={onDeleteItem}
            onReorder={onReorder}
          />
        ) : (
          <SettingsScreen
            lists={Object.values(lists)}
            settings={settings}
            onTheme={(theme: ThemeMode) => saveSettings({ ...settings, theme })}
            onRestore={onRestore}
          />
        )}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
