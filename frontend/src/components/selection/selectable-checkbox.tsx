import { Check, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectableCheckboxProps {
  checked: boolean;
  selectable: boolean;
  selectionMode: boolean;
  label: string;
  onStart: () => void;
  onToggle: (range: boolean) => void;
  buttonClassName?: string;
  visibilityClassName?: string;
  showPlaceholder?: boolean;
}

export function SelectableCheckbox({
  checked,
  selectable,
  selectionMode,
  label,
  onStart,
  onToggle,
  buttonClassName,
  visibilityClassName = "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
  showPlaceholder = false,
}: SelectableCheckboxProps) {
  if (!selectable && !checked) {
    return showPlaceholder && selectionMode ? (
      <span
        aria-hidden
        className="size-5 rounded border border-muted-foreground/20 bg-muted/40"
      />
    ) : null;
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={!selectable}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.stopPropagation();
        event.preventDefault();
        if (selectionMode) onToggle(event.shiftKey);
        else onStart();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (selectionMode) onToggle(event.shiftKey);
        else onStart();
      }}
      className={cn(
        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 bg-background text-transparent",
        selectionMode || checked ? "pointer-events-auto opacity-100" : visibilityClassName,
        buttonClassName,
      )}
    >
      {checked ? <Check className="size-3.5" /> : <Square className="size-3.5" />}
    </button>
  );
}
