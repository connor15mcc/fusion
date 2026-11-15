import { useEffect, useRef } from "react";

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD_PX = 10;

interface UseSelectableRowOptions<T> {
  item: T;
  selectable: boolean;
  selectionMode: boolean;
  checked: boolean;
  onStartSelection: (item: T) => void;
  onToggleSelection: (item: T, range: boolean) => void;
  onActivate: () => void;
  onKeyActivate?: () => void;
  keyboardTarget?: "self" | "interactive";
  ignoreInteractiveClickTargets?: boolean;
}

export function useSelectableRow<T>({
  item,
  selectable,
  selectionMode,
  checked,
  onStartSelection,
  onToggleSelection,
  onActivate,
  onKeyActivate = onActivate,
  keyboardTarget = "interactive",
  ignoreInteractiveClickTargets = true,
}: UseSelectableRowOptions<T>) {
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressContextMenuRef = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse") {
      suppressContextMenuRef.current = false;
      return;
    }
    if (!selectable) return;
    if ((event.target as HTMLElement).closest("button, a")) return;

    cancelLongPress();
    suppressClickRef.current = false;
    suppressContextMenuRef.current = true;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      suppressClickRef.current = true;
      onStartSelection(item);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const start = pointerStartRef.current;
    if (!start) return;

    if (
      Math.abs(event.clientX - start.x) > MOVE_THRESHOLD_PX ||
      Math.abs(event.clientY - start.y) > MOVE_THRESHOLD_PX
    ) {
      cancelLongPress();
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (
      ignoreInteractiveClickTargets &&
      (event.target as HTMLElement).closest("button, a")
    ) {
      return;
    }

    const range = event.shiftKey;
    if (selectionMode) {
      event.preventDefault();
      if (selectable) onToggleSelection(item, range);
      return;
    }

    if (selectable && (range || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (!range && !checked) onStartSelection(item);
      else onToggleSelection(item, range);
      return;
    }

    onActivate();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (keyboardTarget === "self" && event.target !== event.currentTarget) {
      return;
    }
    if (
      keyboardTarget === "interactive" &&
      (event.target as HTMLElement).closest("button, a")
    ) {
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    if (selectionMode) {
      if (selectable) onToggleSelection(item, false);
    } else if (selectable && event.shiftKey) {
      onToggleSelection(item, true);
    } else if (selectable && (event.metaKey || event.ctrlKey)) {
      onToggleSelection(item, false);
    } else {
      onKeyActivate();
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: cancelLongPress,
    onPointerCancel: cancelLongPress,
    onContextMenu: (event: React.MouseEvent) => {
      if (suppressContextMenuRef.current) event.preventDefault();
    },
  };
}
