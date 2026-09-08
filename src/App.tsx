import { useCallback, useEffect, useState } from 'react';
import { TabBar, type Tab } from './components/TabBar';
import { ListScreen } from './screens/ListScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import * as db from './db';
import { expiresAt } from './time';
import {
  DEFAULT_SETTINGS,
  MAX_ITEMS,
  type Backup,
  type Item,
  type List,
  type Settings,
  type ThemeMode,
} from './types';

const THEME_COLOR = { light: '#f2efe7', dark: '#0b0b0c' };

export function App() {
  const [tab, setTab] = useState<Tab>('list');
  const [list, setList] = useState<List | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([db.getList(), db.getSettings()])
      .then(([storedList, storedSettings]) => {
        setList(storedList);
        setSettings(storedSettings);
      })
      .catch(() => {
        /* first run, or storage blocked — fall through to the empty state */
      })
      .finally(() => setReady(true));
  }, []);

  /* Screen-level clock: day rollover, pending -> live, expiry. Coarse on
     purpose — the second hand belongs to <Countdown>, so the whole tree is not
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

  /* Land on the deadline itself rather than up to a poll late. */
  useEffect(() => {
    if (!list) return;
    const delay = expiresAt(list) - Date.now();
    if (delay <= 0 || delay > 2_147_483_000) return;
    const timer = setTimeout(() => setNow(Date.now()), delay + 200);
    return () => clearTimeout(timer);
  }, [list]);

  /* The whole point of the app: the list deletes itself, finished or not. */
  useEffect(() => {
    if (!ready || !list || now < expiresAt(list)) return;
    setList(null);
  }, [ready, list, now]);

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

  /* Single write path: whatever `list` becomes is what ends up on disk. */
  useEffect(() => {
    if (!ready) return;
    // Storage can be blocked outright (private mode, locked-down browser); the
    // app still works for the session, it just will not survive a reload.
    void (list ? db.putList(list) : db.deleteList()).catch(() => {});
  }, [ready, list]);

  const update = useCallback((fn: (current: List) => List) => {
    setList((current) => (current ? fn(current) : current));
  }, []);

  const saveSettings = useCallback((next: Settings) => {
    setSettings(next);
    void db.putSettings(next).catch(() => {});
  }, []);

  const onSchedule = (date: string, deadline: string) =>
    setList((current) =>
      current
        ? { ...current, date, deadline }
        : { id: 'current', date, deadline, createdAt: Date.now(), items: [] },
    );

  const onReorder = (from: number, to: number) =>
    update((current) => {
      const items = [...current.items];
      items.splice(to, 0, ...items.splice(from, 1));
      return { ...current, items };
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
    update((current) =>
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
    update((current) => mapItems(current, (i) => (i.id === id ? { ...i, name, minutes } : i)));

  const onToggleItem = (id: string) => {
    const at = Date.now();
    update((current) =>
      mapItems(current, (i) =>
        i.id === id ? { ...i, done: !i.done, doneAt: i.done ? null : at } : i,
      ),
    );
  };

  const onDeleteItem = (id: string) =>
    update((current) => ({ ...current, items: current.items.filter((i) => i.id !== id) }));

  const onRestore = (backup: Backup) => {
    saveSettings(backup.settings);
    setList(backup.list);
    setTab('list');
  };

  return (
    <div className="app">
      <main className="screen">
        {!ready ? null : tab === 'list' ? (
          <ListScreen
            list={list}
            now={now}
            onSchedule={onSchedule}
            onReorder={onReorder}
            onDiscard={() => setList(null)}
            onAddItem={onAddItem}
            onSaveItem={onSaveItem}
            onToggleItem={onToggleItem}
            onDeleteItem={onDeleteItem}
          />
        ) : (
          <SettingsScreen
            list={list}
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
