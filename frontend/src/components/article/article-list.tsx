import { useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, ListChecks, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleItem } from "./article-item";
import { ContentHeader } from "@/components/layout/content-header";
import { SidebarTrigger } from "@/components/layout/sidebar-trigger";
import { useArticleNavigation } from "@/hooks/use-keyboard";
import { useUrlState, type ArticleFilter } from "@/hooks/use-url-state";
import { useArticleList } from "@/hooks/use-article-list";
import { useMarkItemsRead, useMarkItemsUnread } from "@/queries/items";
import { useFeedLookup } from "@/queries/feeds";
import { useGroups } from "@/queries/groups";
import { useCreateBookmark, useDeleteBookmark } from "@/queries/bookmarks";
import { getFaviconUrl } from "@/lib/api/favicon";
import { useI18n } from "@/lib/i18n";
import {
  isSelectableArticle,
  selectableArticleIds,
} from "@/lib/article-selection";
import { chunkIds } from "@/lib/selection";
import { useSelection } from "@/hooks/use-selection";
import {
  articleListKey,
  useArticlePinsStore,
  useReadStatePins,
} from "@/store";
import { useUIStore } from "@/store/ui";
import type { Item } from "@/lib/api";

export function ArticleList() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const {
    articleFilter,
    setArticleFilter,
    selectedFeedId,
    selectedGroupId,
    selectedArticleId,
    setSelectedArticle,
  } = useUrlState();

  const {
    articles,
    hasMore,
    isLoading,
    isLoadingMore,
    fetchNextPage,
    isItemStarred,
    getBookmarkByItemId,
  } = useArticleList({
    feedId: selectedFeedId,
    groupId: selectedGroupId,
    articleFilter,
  });

  const { data: groups = [] } = useGroups();
  const { feeds, getFeedById, isLoading: isFeedsLoading } = useFeedLookup();
  const markItemsRead = useMarkItemsRead();
  const markItemsUnread = useMarkItemsUnread();
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();

  const { pinRead, unpinRead } = useReadStatePins({
    feedId: selectedFeedId,
    groupId: selectedGroupId,
    articleFilter,
  });

  const pinsKey = articleListKey(selectedFeedId, selectedGroupId, articleFilter);
  const clearPins = useArticlePinsStore((s) => s.clearPins);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const isAddGroupOpen = useUIStore((s) => s.isAddGroupOpen);
  const isAddFeedOpen = useUIStore((s) => s.isAddFeedOpen);
  const isEditFeedOpen = useUIStore((s) => s.isEditFeedOpen);
  const isImportOpmlOpen = useUIStore((s) => s.isImportOpmlOpen);
  const isShortcutsOpen = useUIStore((s) => s.isShortcutsOpen);

  // Leaving this exact list (filter/feed/group change or unmount) commits the
  // read markings: pinned rows stop being shown in the unread view. Only the
  // list itself clears pins — the drawer stays mounted on other pages and must
  // not commit on its own lifecycle.
  useEffect(() => {
    return () => {
      clearPins(pinsKey);
    };
  }, [pinsKey, clearPins]);

  const {
    selectedIds,
    setSelectedIds,
    selectionMode,
    selectableIds,
    allSelected: allLoadedSelected,
    clearSelection,
    startSelection,
    toggleSelection,
    toggleSelectAll,
  } = useSelection({
    items: articles,
    isSelectable: isSelectableArticle,
    resetKey: pinsKey,
    onStartSelection: () => setSelectedArticle(null),
  });

  const articleIds = articles.map((a) => a.id);
  useArticleNavigation(articleIds, {
    enabled: selectedArticleId === null && !selectionMode,
  });

  // When every loaded row has been read away (hidden from the unread view),
  // keep pulling deeper pages instead of dead-ending on an empty list while
  // the server still has unread items.
  useEffect(() => {
    if (isLoading || isLoadingMore) return;
    if (articles.length === 0 && hasMore) {
      fetchNextPage();
    }
  }, [articles.length, hasMore, isLoading, isLoadingMore, fetchNextPage]);

  let title = t("article.list.all");
  if (selectedFeedId) {
    const feed = getFeedById(selectedFeedId);
    title = feed?.name ?? t("article.feedFallback");
  } else if (selectedGroupId) {
    const group = groups.find((g) => g.id === selectedGroupId);
    title = group?.name ?? t("article.groupFallback");
  }

  const hasNoFeeds = !isFeedsLoading && feeds.length === 0;
  const unreadCount = selectableIds.length;

  useEffect(() => {
    if (!selectionMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (
        isSearchOpen ||
        isSettingsOpen ||
        isAddGroupOpen ||
        isAddFeedOpen ||
        isEditFeedOpen ||
        isImportOpmlOpen ||
        isShortcutsOpen
      ) {
        return;
      }

      event.preventDefault();
      clearSelection();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    clearSelection,
    isAddFeedOpen,
    isAddGroupOpen,
    isEditFeedOpen,
    isImportOpmlOpen,
    isSearchOpen,
    isSettingsOpen,
    isShortcutsOpen,
    selectionMode,
  ]);

  const handleToggleRead = useCallback(
    async (article: Item) => {
      if (article.id <= 0) return;

      try {
        if (article.unread) {
          // Pin before the request so the optimistic unread flip cannot
          // drop the row (still visible for undo) before the pin lands.
          pinRead([article.id]);
          await markItemsRead.mutateAsync([article.id]);
        } else {
          await markItemsUnread.mutateAsync([article.id]);
          unpinRead([article.id]);
        }
      } catch (error) {
        console.error("Failed to toggle read status:", error);
      }
    },
    [markItemsRead, markItemsUnread, pinRead, unpinRead],
  );

  const handleToggleStar = useCallback(
    async (article: Item) => {
      try {
        if (isItemStarred(article.id)) {
          const bookmark = getBookmarkByItemId(article.id);
          if (bookmark) {
            await deleteBookmark.mutateAsync(bookmark.id);
          }
          return;
        }

        await createBookmark.mutateAsync(article);
      } catch (error) {
        console.error("Failed to toggle star:", error);
      }
    },
    [createBookmark, deleteBookmark, getBookmarkByItemId, isItemStarred],
  );

  const handleMarkAllAsRead = async () => {
    const unreadIds = selectableArticleIds(articles);

    if (unreadIds.length === 0) return;

    try {
      for (const batch of chunkIds(unreadIds)) {
        pinRead(batch);
        await markItemsRead.mutateAsync(batch);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;

    const selected = [...selectedIds];
    const batches = chunkIds(selected);
    let completedBatches = 0;

    try {
      for (const batch of batches) {
        pinRead(batch);
        await markItemsRead.mutateAsync(batch);
        completedBatches += 1;
      }
      clearSelection();
    } catch (error) {
      console.error("Failed to mark selected articles as read:", error);
      unpinRead(batches[completedBatches] ?? []);
      setSelectedIds(new Set(batches.slice(completedBatches).flat()));
      toast.error(t("article.selection.markReadFailed"));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <ContentHeader>
        {selectionMode ? (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearSelection}
                aria-label={t("article.selection.cancel")}
                title={t("article.selection.cancel")}
              >
                <X className="h-4 w-4" />
              </Button>
              <span className="truncate text-sm font-medium">
                {t("article.selection.count", { count: selectedIds.size })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                disabled={selectableIds.length === 0}
                className="hidden gap-1.5 text-xs sm:inline-flex"
              >
                <ListChecks className="h-4 w-4" />
                {allLoadedSelected
                  ? t("article.selection.clear")
                  : t("article.selection.selectAllLoaded")}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={toggleSelectAll}
                disabled={selectableIds.length === 0}
                className="sm:hidden"
                aria-label={
                  allLoadedSelected
                    ? t("article.selection.clear")
                    : t("article.selection.selectAllLoaded")
                }
                title={
                  allLoadedSelected
                    ? t("article.selection.clear")
                    : t("article.selection.selectAllLoaded")
                }
              >
                <ListChecks className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleMarkSelectedAsRead}
                disabled={markItemsRead.isPending}
                className="gap-1.5 text-xs"
                aria-label={t("article.selection.markRead")}
                title={t("article.selection.markRead")}
              >
                {markItemsRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {t("article.selection.markRead")}
                </span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-1">
              <SidebarTrigger />
              <h2 className="truncate text-lg font-semibold">{title}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="h-4 w-4" />
              {t("article.list.markAllRead")}
            </Button>
          </>
        )}
      </ContentHeader>

      {/* Article area with filter tabs */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6">
        {/* Filter tabs - hidden when no articles exist */}
        {!hasNoFeeds && (articles.length > 0 || articleFilter !== "all") && (
          <Tabs
            value={articleFilter}
            onValueChange={(v) => setArticleFilter(v as ArticleFilter)}
          >
            <TabsList>
              <TabsTrigger value="all">{t("article.filter.all")}</TabsTrigger>
              <TabsTrigger value="unread">{t("article.filter.unread")}</TabsTrigger>
              <TabsTrigger value="starred">
                {t("article.filter.starred")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

            {/* Article list */}
        <ScrollArea className="min-h-0 flex-1">
          <div>
            {isLoading || (articles.length === 0 && hasMore) ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-md bg-accent"
                  />
                ))}
              </div>
            ) : articles.length === 0 ? (
              hasNoFeeds ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("article.list.noFeeds")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: "/feeds" })}
                  >
                    {t("article.list.openFeedManagement")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("article.list.noArticles")}
                  </p>
                </div>
              )
            ) : (
              <>
                {articles.map((article) => {
                  const feed = getFeedById(article.feed_id);
                  const bookmark = getBookmarkByItemId(article.id);

                  return (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      selectedArticleId={selectedArticleId}
                      onSelectArticle={setSelectedArticle}
                      selectionMode={selectionMode}
                      isChecked={selectedIds.has(article.id)}
                      isSelectable={isSelectableArticle(article)}
                      onToggleSelection={toggleSelection}
                      onStartSelection={startSelection}
                      onToggleRead={handleToggleRead}
                      onToggleStar={handleToggleStar}
                      canToggleRead={article.id > 0}
                      isStarred={isItemStarred(article.id)}
                      feedName={feed?.name ?? bookmark?.feed_name ?? t("common.unknown")}
                      feedFaviconUrl={
                        feed ? getFaviconUrl(feed.link, feed.site_url) : null
                      }
                    />
                  );
                })}
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isLoadingMore}
                      className="gap-2"
                    >
                      {isLoadingMore && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {isLoadingMore
                        ? t("article.list.loading")
                        : t("article.list.loadMore")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
