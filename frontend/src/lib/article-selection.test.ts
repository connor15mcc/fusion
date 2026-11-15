import { describe, expect, it } from "vitest";
import { isSelectableArticle, selectableArticleIds } from "./article-selection";

const article = (id: number, unread = true): { id: number; unread: boolean } => ({
  id,
  unread,
});

describe("isSelectableArticle", () => {
  it("requires a positive id and unread state", () => {
    expect(isSelectableArticle(article(1))).toBe(true);
    expect(isSelectableArticle(article(1, false))).toBe(false);
    expect(isSelectableArticle(article(-1))).toBe(false);
    expect(isSelectableArticle(article(0))).toBe(false);
  });
});

describe("selectableArticleIds", () => {
  it("keeps selectable ids in list order and removes duplicates", () => {
    expect(
      selectableArticleIds([
        article(3),
        article(2, false),
        article(-4),
        article(5),
        article(3),
      ]),
    ).toEqual([3, 5]);
  });
});
