export const MAX_BATCH_IDS = 1000;

type SelectableItem = { id: number };

export type ToggleAllMode = "replace" | "toggle-visible";

export function selectableIds<T extends SelectableItem>(
  items: readonly T[],
  isSelectable: (item: T) => boolean,
): number[] {
  const seen = new Set<number>();
  const ids: number[] = [];

  for (const item of items) {
    if (!isSelectable(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    ids.push(item.id);
  }

  return ids;
}

export function toggleSelectedId(
  selected: ReadonlySet<number>,
  id: number,
): Set<number> {
  const next = new Set(selected);

  if (next.has(id)) {
    next.delete(id);
  } else if (id > 0) {
    next.add(id);
  }

  return next;
}

export function unionSelectionRange<T extends SelectableItem>(
  selected: ReadonlySet<number>,
  items: readonly T[],
  anchorId: number | null,
  targetId: number,
  isSelectable: (item: T) => boolean,
): Set<number> {
  const next = new Set(selected);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (targetIndex === -1 || !isSelectable(items[targetIndex])) {
    return next;
  }

  next.add(targetId);
  if (anchorId === null) return next;

  const anchorIndex = items.findIndex((item) => item.id === anchorId);
  if (anchorIndex === -1) return next;

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);

  for (let index = start; index <= end; index += 1) {
    const item = items[index];
    if (isSelectable(item)) next.add(item.id);
  }

  return next;
}

export function toggleAllSelectable<T extends SelectableItem>(
  selected: ReadonlySet<number>,
  items: readonly T[],
  isSelectable: (item: T) => boolean,
  mode: ToggleAllMode = "replace",
): Set<number> {
  const ids = selectableIds(items, isSelectable);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  if (mode === "toggle-visible") {
    if (!allSelected) return new Set([...selected, ...ids]);

    const visible = new Set(ids);
    return new Set([...selected].filter((id) => !visible.has(id)));
  }

  return allSelected ? new Set<number>() : new Set(ids);
}

export function pruneSelection<T extends SelectableItem>(
  selected: ReadonlySet<number>,
  items: readonly T[],
): Set<number> {
  const available = new Set(items.map((item) => item.id));
  const next = new Set<number>();

  for (const id of selected) {
    if (available.has(id)) next.add(id);
  }

  return next;
}

export function chunkIds(
  ids: readonly number[],
  size = MAX_BATCH_IDS,
): number[][] {
  if (ids.length === 0) return [];

  const chunks: number[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}
