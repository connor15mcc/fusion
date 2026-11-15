import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pruneSelection,
  selectableIds,
  toggleAllSelectable,
  toggleSelectedId,
  unionSelectionRange,
  type ToggleAllMode,
} from "@/lib/selection";

interface UseSelectionOptions<T extends { id: number }> {
  items: readonly T[];
  isSelectable: (item: T) => boolean;
  resetKey?: unknown;
  pruneItems?: readonly T[];
  toggleAllMode?: ToggleAllMode;
  startMode?: "add" | "replace";
  onStartSelection?: (item: T) => void;
}

export function useSelection<T extends { id: number }>({
  items,
  isSelectable,
  resetKey,
  pruneItems,
  toggleAllMode = "replace",
  startMode = "add",
  onStartSelection,
}: UseSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionAnchorId, setSelectionAnchorId] = useState<number | null>(
    null,
  );

  const selectableItemIds = useMemo(
    () => selectableIds(items, isSelectable),
    [items, isSelectable],
  );
  const selectionMode = selectedIds.size > 0;
  const allSelected =
    selectableItemIds.length > 0 &&
    selectableItemIds.every((id) => selectedIds.has(id));

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionAnchorId(null);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [clearSelection, resetKey]);

  useEffect(() => {
    if (!pruneItems) return;
    setSelectedIds((current) => pruneSelection(current, pruneItems));
  }, [pruneItems]);

  const startSelection = useCallback(
    (item: T) => {
      if (!isSelectable(item)) return;

      setSelectedIds((current) =>
        startMode === "replace" ? new Set([item.id]) : new Set([...current, item.id]),
      );
      setSelectionAnchorId(item.id);
      onStartSelection?.(item);
    },
    [isSelectable, onStartSelection, startMode],
  );

  const toggleSelection = useCallback(
    (item: T, range: boolean) => {
      if (!isSelectable(item)) return;

      if (range) {
        setSelectedIds((current) =>
          unionSelectionRange(
            current,
            items,
            selectionAnchorId,
            item.id,
            isSelectable,
          ),
        );
        setSelectionAnchorId(item.id);
        return;
      }

      setSelectedIds((current) => {
        const next = toggleSelectedId(current, item.id);
        setSelectionAnchorId(next.has(item.id) ? item.id : null);
        return next;
      });
    },
    [isSelectable, items, selectionAnchorId],
  );

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) =>
      toggleAllSelectable(current, items, isSelectable, toggleAllMode),
    );
    setSelectionAnchorId(null);
  }, [isSelectable, items, toggleAllMode]);

  return {
    selectedIds,
    setSelectedIds,
    selectionMode,
    selectableIds: selectableItemIds,
    allSelected,
    clearSelection,
    startSelection,
    toggleSelection,
    toggleSelectAll,
  };
}
