import { describe, expect, it } from "vitest";
import { isSelectableFeed, selectableFeedIds } from "./feed-selection";

const feed = (id: number) => ({ id });

describe("isSelectableFeed", () => {
  it("requires a positive id", () => {
    expect(isSelectableFeed(feed(1))).toBe(true);
    expect(isSelectableFeed(feed(0))).toBe(false);
    expect(isSelectableFeed(feed(-1))).toBe(false);
  });
});

describe("selectableFeedIds", () => {
  it("keeps feed ids in list order and removes duplicates", () => {
    expect(selectableFeedIds([feed(3), feed(-1), feed(2), feed(3)])).toEqual([
      3, 2,
    ]);
  });
});
