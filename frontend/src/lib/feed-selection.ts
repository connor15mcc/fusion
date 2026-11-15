import type { Feed } from "@/lib/api";
import { selectableIds } from "@/lib/selection";

export function isSelectableFeed(feed: Pick<Feed, "id">): boolean {
  return feed.id > 0;
}

export function selectableFeedIds(feeds: Pick<Feed, "id">[]): number[] {
  return selectableIds(feeds, isSelectableFeed);
}
