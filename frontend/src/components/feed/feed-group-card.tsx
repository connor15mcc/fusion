import { ChevronDown, ChevronRight, Folder, Pencil, Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { FeedRow } from "@/components/feed/feed-row";
import { Input } from "@/components/ui/input";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Feed, Group } from "@/lib/api";

interface FeedGroupCardProps {
  group: Group;
  groupFeeds: Feed[];
  isCollapsed: boolean;
  isEditing: boolean;
  editingGroupName: string;
  isMobile: boolean;
  mobileErrorTooltipFeedId: number | null;
  isSelectionMode: boolean;
  selectedFeedIds: ReadonlySet<number>;
  onToggleGroup: (groupId: number) => void;
  onStartEditingGroup: (group: Group) => void;
  onChangeEditingGroupName: (value: string) => void;
  onSaveGroupName: (group: Group) => void;
  onCancelEditingGroup: () => void;
  onOpenAddFeed: () => void;
  onOpenDeleteGroup: (group: Group) => void;
  onOpenEditFeed: (feed: Feed) => void;
  onToggleFeedSelection: (feed: Feed, range: boolean) => void;
  onStartFeedSelection: (feed: Feed) => void;
  onChangeMobileErrorTooltipFeedId: Dispatch<SetStateAction<number | null>>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function FeedGroupCard({
  group,
  groupFeeds,
  isCollapsed,
  isEditing,
  editingGroupName,
  isMobile,
  mobileErrorTooltipFeedId,
  isSelectionMode,
  selectedFeedIds,
  onToggleGroup,
  onStartEditingGroup,
  onChangeEditingGroupName,
  onSaveGroupName,
  onCancelEditingGroup,
  onOpenAddFeed,
  onOpenDeleteGroup,
  onOpenEditFeed,
  onToggleFeedSelection,
  onStartFeedSelection,
  onChangeMobileErrorTooltipFeedId,
  t,
}: FeedGroupCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className={cn(
          "group/header flex items-center justify-between bg-muted/50 px-3.5 py-2.5",
          isCollapsed ? "rounded-lg" : "rounded-t-lg",
        )}
      >
        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <Folder
              className={cn(
                "h-4 w-4",
                isCollapsed && "text-muted-foreground",
              )}
            />
            <Input
              value={editingGroupName}
              onChange={(e) => onChangeEditingGroupName(e.target.value)}
              onBlur={() => onSaveGroupName(group)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveGroupName(group);
                if (e.key === "Escape") onCancelEditingGroup();
              }}
              className="h-7 w-40 px-2 text-sm"
              aria-label={t("group.add.placeholder")}
              autoFocus={!isMobile}
            />
            <span
              className={cn(
                "rounded-full bg-muted px-2 py-0.5 text-[11px]",
                isCollapsed
                  ? "font-medium text-muted-foreground"
                  : "font-semibold text-muted-foreground",
              )}
            >
              {groupFeeds.length}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggleGroup(group.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-expanded={!isCollapsed}
            aria-label={`Toggle group ${group.name}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <Folder
              className={cn(
                "h-4 w-4",
                isCollapsed && "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "text-sm",
                isCollapsed ? "font-medium" : "font-semibold",
              )}
            >
              {group.name}
            </span>
            <span
              className={cn(
                "rounded-full bg-muted px-2 py-0.5 text-[11px]",
                isCollapsed
                  ? "font-medium text-muted-foreground"
                  : "font-semibold text-muted-foreground",
              )}
            >
              {groupFeeds.length}
            </span>
          </button>
        )}
        <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover/header:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddFeed();
            }}
            className="rounded p-1 hover:bg-accent"
            aria-label={t("feed.add.button")}
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEditingGroup(group);
            }}
            className="rounded p-1 hover:bg-accent"
            aria-label={t("feeds.renameGroup")}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {group.id !== 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDeleteGroup(group);
              }}
              className="rounded p-1 hover:bg-accent"
              aria-label={t("feeds.deleteGroup.title")}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && groupFeeds.length > 0 && (
        <div>
          {groupFeeds.map((feed, index) => (
            <div
              key={feed.id}
              className={cn(index < groupFeeds.length - 1 && "border-b border-border/50")}
            >
              <FeedRow
                feed={feed}
                isSelectionMode={isSelectionMode}
                isChecked={selectedFeedIds.has(feed.id)}
                isMobile={isMobile}
                mobileErrorTooltipFeedId={mobileErrorTooltipFeedId}
                onToggleSelection={onToggleFeedSelection}
                onStartSelection={onStartFeedSelection}
                onOpenEditFeed={onOpenEditFeed}
                onChangeMobileErrorTooltipFeedId={onChangeMobileErrorTooltipFeedId}
                t={t}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
