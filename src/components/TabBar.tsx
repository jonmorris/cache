export type Tab = 'list' | 'settings';

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'list', label: 'List', glyph: '▤' },
  // U+FE0E keeps iOS from swapping the gear for a colour emoji.
  { id: 'settings', label: 'Settings', glyph: '⚙︎' },
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className="tab"
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-glyph" aria-hidden="true">
            {tab.glyph}
          </span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
