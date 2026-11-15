import type { Item } from "@/lib/api";
import { selectableIds } from "@/lib/selection";

type SelectableArticle = Pick<Item, "id" | "unread">;

export function isSelectableArticle(article: SelectableArticle): boolean {
  return article.id > 0 && article.unread;
}

export function selectableArticleIds(articles: SelectableArticle[]): number[] {
  return selectableIds(articles, isSelectableArticle);
}
