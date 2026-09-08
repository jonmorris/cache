import { useState } from 'react';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { Hud } from '../components/Hud';
import { ItemList } from '../components/ItemList';
import { ItemSheet } from '../components/ItemSheet';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { MAX_ITEMS, type Item, type List } from '../types';
import { dayLabel, deadlineLabel, isPending, shortDate } from '../time';

interface ListScreenProps {
  list: List | null;
  now: number;
  onSchedule: (date: string, start: string, deadline: string) => void;
  onDiscard: () => void;
  onAddItem: (name: string, minutes: number) => void;
  onSaveItem: (id: string, name: string, minutes: number) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

type ItemTarget = { mode: 'add' } | { mode: 'edit'; item: Item };

export function ListScreen(props: ListScreenProps) {
  const { list, now } = props;
  const [scheduling, setScheduling] = useState(false);
  const [itemSheet, setItemSheet] = useState<ItemTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const schedule = (
    <ScheduleSheet
      open={scheduling}
      title={list ? 'Change schedule' : 'New list'}
      cta={list ? 'Save' : 'Create'}
      now={now}
      date={list?.date ?? null}
      start={list?.start ?? null}
      deadline={list?.deadline ?? null}
      onSubmit={(date, start, deadline) => {
        props.onSchedule(date, start, deadline);
        setScheduling(false);
      }}
      onClose={() => setScheduling(false)}
    />
  );

  if (!list) {
    return (
      <>
        <div className="empty">
          <div className="empty-mark" aria-hidden="true">
            [ ]
          </div>
          <p className="empty-title">No active list</p>
          <button className="btn primary" onClick={() => setScheduling(true)}>
            New list
          </button>
          <p className="empty-note">One list at a time · clears itself</p>
        </div>
        {schedule}
      </>
    );
  }

  const full = list.items.length >= MAX_ITEMS;
  const locked = isPending(list, now);

  return (
    <>
      <header className="head">
        <button className="daybtn" onClick={() => setScheduling(true)}>
          <span className="daybtn-day">{dayLabel(list.date, now)}</span>
          <span className="daybtn-date">{shortDate(list.date)}</span>
          <span className="daybtn-edit" aria-hidden="true">
            Change
          </span>
        </button>

        {locked && (
          <p className="banner">
            <span className="banner-key">Locked</span>
            <span>· Opens {dayLabel(list.date, now)}</span>
          </p>
        )}

        <Hud list={list} />

      </header>

      {list.items.length === 0 ? (
        <p className="foot-note" style={{ textAlign: 'center' }}>
          No items yet · up to {MAX_ITEMS}
        </p>
      ) : (
        <ItemList
          items={list.items}
          lockTicking={locked}
          onReorder={props.onReorder}
          onToggle={props.onToggleItem}
          onEdit={(item) => setItemSheet({ mode: 'edit', item })}
          onDelete={setPendingDelete}
        />
      )}

      <button className="addrow" disabled={full} onClick={() => setItemSheet({ mode: 'add' })}>
        {full ? `List full · ${MAX_ITEMS}/${MAX_ITEMS} items` : '+ Add item'}
      </button>

      <div className="listfoot">
        <button className="link-danger" onClick={() => setConfirmDiscard(true)}>
          Discard list
        </button>
      </div>

      {schedule}

      <ItemSheet
        open={itemSheet !== null}
        mode={itemSheet?.mode ?? 'add'}
        initialName={itemSheet?.mode === 'edit' ? itemSheet.item.name : ''}
        initialMinutes={itemSheet?.mode === 'edit' ? itemSheet.item.minutes : 30}
        onSubmit={(name, minutes) => {
          if (itemSheet?.mode === 'edit') props.onSaveItem(itemSheet.item.id, name, minutes);
          else props.onAddItem(name, minutes);
          setItemSheet(null);
        }}
        onClose={() => setItemSheet(null)}
      />

      <ConfirmSheet
        open={pendingDelete !== null}
        title="Delete item"
        body={
          <>
            Remove <strong>{pendingDelete?.name}</strong> from the list?
          </>
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) props.onDeleteItem(pendingDelete.id);
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />

      <ConfirmSheet
        open={confirmDiscard}
        title="Discard list"
        body={
          <>
            Delete this list and its {list.items.length}{' '}
            {list.items.length === 1 ? 'item' : 'items'} now, without waiting for{' '}
            <strong>{deadlineLabel(list)}</strong>?
          </>
        }
        confirmLabel="Discard"
        onConfirm={() => {
          props.onDiscard();
          setConfirmDiscard(false);
        }}
        onClose={() => setConfirmDiscard(false)}
      />
    </>
  );
}
