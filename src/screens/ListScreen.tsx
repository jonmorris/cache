import { useState } from 'react';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { DayNav } from '../components/DayNav';
import { Hud } from '../components/Hud';
import { ItemList } from '../components/ItemList';
import { ItemSheet } from '../components/ItemSheet';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { MAX_ITEMS, tasksFull, type Item, type Kind, type List } from '../types';
import { dayLabel, deadlineLabel, isPending } from '../time';

interface ListScreenProps {
  /** The list for the day being viewed, if there is one. */
  list: List | null;
  date: string;
  now: number;
  planned: Set<string>;
  onPickDay: (date: string) => void;
  onSchedule: (start: string, deadline: string) => void;
  onDiscard: () => void;
  onAddItem: (name: string, minutes: number, kind: Kind) => void;
  onSaveItem: (id: string, name: string, minutes: number, kind: Kind) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (from: number, to: number) => void;
}

type ItemTarget = { mode: 'add' } | { mode: 'edit'; item: Item };

export function ListScreen(props: ListScreenProps) {
  const { list, date, now } = props;
  const [scheduling, setScheduling] = useState(false);
  const [itemSheet, setItemSheet] = useState<ItemTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const items = list?.items ?? [];
  // The cap counts tasks only, so a full list still takes transit — the add
  // row stays live and the sheet is what refuses an eighth task.
  const full = tasksFull(items);
  const locked = list ? isPending(list, now) : false;

  return (
    <>
      <DayNav date={date} now={now} planned={props.planned} onPick={props.onPickDay} />

      {!list ? (
        <div className="empty">
          <div className="empty-mark" aria-hidden="true">
            [ ]
          </div>
          <p className="empty-title">Nothing for {dayLabel(date, now)}</p>
          <button className="btn primary" onClick={() => setScheduling(true)}>
            New list
          </button>
          <p className="empty-note">One list a day · clears itself</p>
        </div>
      ) : (
        <>
          <Hud list={list} onEditTimes={() => setScheduling(true)} />

          {list.items.length === 0 ? (
            <p className="foot-note" style={{ textAlign: 'center', marginTop: 18 }}>
              No items yet · up to {MAX_ITEMS} tasks, transit on top
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

          <button className="addrow" data-full={full} onClick={() => setItemSheet({ mode: 'add' })}>
            {full ? `Tasks full · ${MAX_ITEMS}/${MAX_ITEMS} · add transit` : '+ Add item'}
          </button>

          <div className="listfoot">
            <button className="link-danger" onClick={() => setConfirmDiscard(true)}>
              Discard list
            </button>
          </div>
        </>
      )}

      <ScheduleSheet
        open={scheduling}
        title={list ? 'Change times' : `New list · ${dayLabel(date, now).toLowerCase()}`}
        cta={list ? 'Save' : 'Create'}
        now={now}
        date={date}
        start={list?.start ?? null}
        deadline={list?.deadline ?? null}
        onSubmit={(start, deadline) => {
          props.onSchedule(start, deadline);
          setScheduling(false);
        }}
        onClose={() => setScheduling(false)}
      />

      <ItemSheet
        open={itemSheet !== null}
        mode={itemSheet?.mode ?? 'add'}
        initialName={itemSheet?.mode === 'edit' ? itemSheet.item.name : ''}
        initialMinutes={itemSheet?.mode === 'edit' ? itemSheet.item.minutes : 30}
        initialKind={itemSheet?.mode === 'edit' ? itemSheet.item.kind : 'task'}
        tasksFull={full}
        onSubmit={(name, minutes, kind) => {
          if (itemSheet?.mode === 'edit') props.onSaveItem(itemSheet.item.id, name, minutes, kind);
          else props.onAddItem(name, minutes, kind);
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
            Delete the {dayLabel(date, now).toLowerCase()} list and its {list?.items.length ?? 0}{' '}
            {list?.items.length === 1 ? 'item' : 'items'} now, without waiting for{' '}
            <strong>{list ? deadlineLabel(list) : ''}</strong>?
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
