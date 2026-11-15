import { Circle, CircleCheck, Star, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SelectableCheckbox } from "@/components/selection/selectable-checkbox";
import { useSelectableRow } from "@/hooks/use-selectable-row";
import { useI18n } from "@/lib/i18n";
import { cn, formatDate, extractSummary } from "@/lib/utils";
import type { Item } from "@/lib/api";
import { FeedFavicon } from "@/components/feed/feed-favicon";
import { toSafeExternalUrl } from "@/lib/safe-url";

interface ArticleItemProps {
  article: Item;
  selectedArticleId: number | null;
  onSelectArticle: (articleId: number | null) => void;
  selectionMode: boolean;
  isChecked: boolean;
  isSelectable: boolean;
  onToggleSelection: (article: Item, range: boolean) => void;
  onStartSelection: (article: Item) => void;
  onToggleRead: (article: Item) => Promise<void>;
  onToggleStar: (article: Item) => Promise<void>;
  canToggleRead: boolean;
  isStarred: boolean;
  feedName: string;
  feedFaviconUrl: string | null;
}

export function ArticleItem({
  article,
  selectedArticleId,
  onSelectArticle,
  selectionMode,
  isChecked,
  isSelectable,
  onToggleSelection,
  onStartSelection,
  onToggleRead,
  onToggleStar,
  canToggleRead,
  isStarred,
  feedName,
  feedFaviconUrl,
}: ArticleItemProps) {
  const { t } = useI18n();

  const isSelected = selectedArticleId === article.id;
  const safeArticleLink = toSafeExternalUrl(article.link);
  const rowProps = useSelectableRow({
    item: article,
    selectable: isSelectable,
    selectionMode,
    checked: isChecked,
    onStartSelection,
    onToggleSelection,
    onActivate: () => onSelectArticle(article.id),
    keyboardTarget: "self",
    ignoreInteractiveClickTargets: false,
  });

  const handleToggleRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canToggleRead) return;

    try {
      await onToggleRead(article);
    } catch (error) {
      console.error("Failed to toggle read status:", error);
    }
  };

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onToggleStar(article);
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      {...rowProps}
      className={cn(
        "group relative flex w-full cursor-pointer items-start gap-4 border-b px-4 py-4 text-left transition-colors select-none [-webkit-touch-callout:none] hover:bg-accent/50",
        selectionMode && "cursor-default",
        isSelected && "bg-accent",
        isChecked && "bg-primary/10 hover:bg-primary/15",
      )}
    >
      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <SelectableCheckbox
          checked={isChecked}
          selectable={isSelectable}
          selectionMode={selectionMode}
          label={
            isChecked
              ? t("article.selection.deselect")
              : t("article.selection.select")
          }
          onStart={() => onStartSelection(article)}
          onToggle={(range) => onToggleSelection(article, range)}
          showPlaceholder
        />
      </div>

      {/* Article Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3
          className={cn(
            "line-clamp-2 text-[15px] leading-snug font-medium",
            article.unread ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {article.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {extractSummary(article.content, 150)}
        </p>
        <div className="flex items-center gap-2 text-xs">
          <FeedFavicon src={feedFaviconUrl} className="h-3.5 w-3.5 rounded-sm" />
          <span className="truncate font-medium text-muted-foreground">
            {feedName}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="shrink-0 text-muted-foreground">
            {formatDate(article.pub_date)}
          </span>
        </div>
      </div>

      {/* Article Actions */}
      {!selectionMode && (
      <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleToggleRead}
          disabled={!canToggleRead}
          className={cn(article.unread ? "bg-muted" : "bg-primary/10")}
          aria-label={
            article.unread
              ? t("article.action.markRead")
              : t("article.action.markUnread")
          }
          title={
            article.unread
              ? t("article.action.markRead")
              : t("article.action.markUnread")
          }
        >
          {article.unread ? (
            <Circle className="text-muted-foreground" />
          ) : (
            <CircleCheck className="text-primary" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleToggleStar}
          className={cn(isStarred ? "bg-amber-100 dark:bg-amber-950/40" : "bg-muted")}
          aria-label={
            isStarred ? t("article.action.unstar") : t("article.action.star")
          }
          title={isStarred ? t("article.action.unstar") : t("article.action.star")}
        >
          <Star
            className={cn(
              isStarred
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground",
            )}
          />
        </Button>
        {safeArticleLink ? (
          <a
            href={safeArticleLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "bg-muted")}
            aria-label={t("article.action.openInBrowser")}
            title={t("article.action.openInBrowser")}
          >
            <ExternalLink className="text-muted-foreground" />
          </a>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            disabled
            className="bg-muted"
            aria-label={t("article.action.openInBrowser")}
            title={t("article.action.openInBrowser")}
          >
            <ExternalLink className="text-muted-foreground" />
          </Button>
        )}
      </div>
      )}
    </div>
  );
}
