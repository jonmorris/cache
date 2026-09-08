import { useRef, useState } from 'react';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { buildBackup, download, parseBackup } from '../backup';
import { APP_VERSION, MAX_ITEMS, type Backup, type List, type Settings, type ThemeMode } from '../types';

const THEMES: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

interface SettingsScreenProps {
  list: List | null;
  settings: Settings;
  onTheme: (theme: ThemeMode) => void;
  onRestore: (backup: Backup) => void;
}

export function SettingsScreen({ list, settings, onTheme, onRestore }: SettingsScreenProps) {
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [staged, setStaged] = useState<Backup | null>(null);
  const filePicker = useRef<HTMLInputElement>(null);

  const exportNow = () => {
    download(buildBackup(list, settings));
    setStatus({ tone: 'ok', text: 'Backup downloaded' });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again after a failure
    if (!file) return;
    try {
      setStaged(parseBackup(await file.text()));
      setStatus(null);
    } catch (err) {
      setStatus({ tone: 'error', text: err instanceof Error ? err.message : 'Import failed' });
    }
  };

  return (
    <>
      <h1 className="screen-title">Settings</h1>

      <section className="sect">
        <h2 className="sect-title">Appearance</h2>
        <div className="segmented">
          {THEMES.map((t) => (
            <button
              key={t.id}
              aria-pressed={settings.theme === t.id}
              onClick={() => onTheme(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2 className="sect-title">Backup</h2>
        <p className="sect-note">
          Cache keeps everything in this browser and nowhere else. Clearing site data, or deleting
          the app, takes the list with it — export first if that would sting.
        </p>
        <button className="btn block" onClick={exportNow}>
          Export JSON
        </button>
        <button className="btn block" onClick={() => filePicker.current?.click()}>
          Import JSON
        </button>
        <input
          ref={filePicker}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
        {status && (
          <p className="status" data-tone={status.tone}>
            {status.text}
          </p>
        )}
      </section>

      <section className="sect">
        <h2 className="sect-title">About</h2>
        <div className="ledger">
          <Row label="Storage" value="On device" />
          <Row label="Accounts" value="None" />
          <Row label="Expires" value="At its deadline" />
          <Row label="Max items" value={String(MAX_ITEMS)} />
          <Row label="Version" value={APP_VERSION} />
        </div>
      </section>

      <ConfirmSheet
        open={staged !== null}
        title="Import backup"
        body={
          <>
            Replace everything on this device with the backup
            {staged?.exportedAt ? ` from ${staged.exportedAt.slice(0, 10)}` : ''}?{' '}
            {staged?.list ? (
              <>
                It holds a list for <strong>{staged.list.date}</strong> with {staged.list.items.length}{' '}
                {staged.list.items.length === 1 ? 'item' : 'items'}.
              </>
            ) : (
              <>It holds no list, so the current one will be cleared.</>
            )}
          </>
        }
        confirmLabel="Replace"
        onConfirm={() => {
          if (staged) onRestore(staged);
          setStaged(null);
        }}
        onClose={() => setStaged(null)}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-row">
      <span>{label}</span>
      <span className="dots" aria-hidden="true" />
      <span className="val">{value}</span>
    </div>
  );
}
