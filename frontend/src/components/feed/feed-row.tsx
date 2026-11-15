import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, Pause, Pencil } from "lucide-react";
import { FeedFavicon } from "@/components/feed/feed-favicon";
import { SelectableCheckbox } from "@/components/selection/selectable-checkbox";
import { useSelectableRow } from "@/hooks/use-selectable-row";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFaviconUrl } from "@/lib/api/favicon";
import { getFeedErrorPreview } from "@/lib/feed-error";
import type { TranslationKey } from "@/lib/i18n";
import { cn, formatDate } from "@/lib/utils";
import type { Feed } from "@/lib/api";

interface FeedRowProps {
  feed: Feed;
  isSelectionMode: boolean;
  isChecked: boolean;
  isMobile: boolean;
  mobileErrorTooltipFeedId: number | null;
  onToggleSelection: (feed: Feed, range: boolean) => void;
  onStartSelection: (feed: Feed) => void;
  onOpenEditFeed: (feed: Feed) => void;
  onChangeMobileErrorTooltipFeedId: Dispatch<SetStateAction<number | null>>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function FeedRow({
  feed,
  isSelectionMode,
  isChecked,
  isMobile,
  mobileErrorTooltipFeedId,
  onToggleSelection,
  onStartSelection,
  onOpenEditFeed,
  onChangeMobileErrorTooltipFeedId,
  t,
}: FeedRowProps) {
  const rowProps = useSelectableRow({
    item: feed,
    selectable: true,
    selectionMode: isSelectionMode,
    checked: isChecked,
    onStartSelection,
    onToggleSelection,
    onActivate: () => undefined,
    onKeyActivate: () => onStartSelection(feed),
  });

  return (
    <div
      role="button"
      tabIndex={0}
      {...rowProps}
      className={cn(
        "group/feed flex cursor-pointer items-center justify-between py-2.5 pl-8 pr-3.5 text-left transition-colors select-none [-webkit-touch-callout:none] hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:outline-none sm:pl-11",
        isSelectionMode && "cursor-default",
        isChecked && "bg-primary/10 hover:bg-primary/15",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <SelectableCheckbox
          checked={isChecked}
          selectable
          selectionMode={isSelectionMode}
          label={
            isChecked
              ? t("feeds.selection.deselect")
              : t("feeds.selection.select")
          }
          onStart={() => onStartSelection(feed)}
          onToggle={(range) => onToggleSelection(feed, range)}
          visibilityClassName="pointer-events-none opacity-0 group-hover/feed:pointer-events-auto group-hover/feed:opacity-100 group-focus-within/feed:pointer-events-auto group-focus-within/feed:opacity-100"
        />
        <FeedFavicon
          src={getFaviconUrl(feed.link, feed.site_url)}
          className="h-5 w-5"
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium">{feed.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {getDomain(feed.link)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {feed.fetch_state.last_error && (
          <Tooltip
            open={isMobile ? mobileErrorTooltipFeedId === feed.id : undefined}
            onOpenChange={(open) => {
              if (!isMobile || open) return;
              onChangeMobileErrorTooltipFeedId((current) =>
                current === feed.id ? null : current,
              );
            }}
          >
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={t("feeds.status.error")}
                  onClick={() => {
                    if (!isMobile) return;
                    onChangeMobileErrorTooltipFeedId((current) =>
                      current === feed.id ? null : feed.id,
                    );
                  }}
                  className="flex items-center gap-1 rounded-sm text-xs text-destructive"
                />
              }
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden max-w-56 truncate font-medium sm:inline">
                {getFeedErrorPreview(feed.fetch_state.last_error)}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-sm whitespace-normal break-words"
            >
              {feed.fetch_state.last_error.trim()}
            </TooltipContent>
          </Tooltip>
        )}
        {feed.suspended && (
          <Pause className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {t("feeds.itemCount", { count: feed.item_count })} ·{" "}
          {feed.fetch_state.last_checked_at > 0
            ? formatDate(feed.fetch_state.last_checked_at)
            : t("common.unknown")}
        </span>
        {!isSelectionMode && (
          <button
            type="button"
            onClick={() => onOpenEditFeed(feed)}
            className="rounded p-1 hover:bg-accent"
            aria-label={t("feed.edit.title")}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
