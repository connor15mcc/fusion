import { describe, expect, it } from "vitest";
import {
  chunkIds,
  pruneSelection,
  selectableIds,
  toggleAllSelectable,
  toggleSelectedId,
  unionSelectionRange,
} from "./selection";

const item = (id: number, selectable = id > 0) => ({ id, selectable });
const isSelectable = (value: { selectable: boolean }) => value.selectable;

describe("selectableIds", () => {
  it("keeps selectable ids in list order and removes duplicates", () => {
    expect(
      selectableIds(
        [item(3), item(2, false), item(-4), item(5), item(3)],
        isSelectable,
      ),
    ).toEqual([3, 5]);
  });
});

describe("toggleSelectedId", () => {
  it("toggles ids without mutating the input set", () => {
    const selected = new Set([1]);
    const added = toggleSelectedId(selected, 2);

    expect([...selected]).toEqual([1]);
    expect([...added]).toEqual([1, 2]);
    expect([...toggleSelectedId(added, 1)]).toEqual([2]);
  });

  it("does not add non-positive ids", () => {
    expect([...toggleSelectedId(new Set(), -2)]).toEqual([]);
  });
});

describe("unionSelectionRange", () => {
  const items = [item(1), item(2), item(3, false), item(4), item(5)];

  it("adds the selectable range while preserving existing selections", () => {
    const result = unionSelectionRange(new Set([5]), items, 1, 4, isSelectable);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 4, 5]);
  });

  it("works in either direction", () => {
    const result = unionSelectionRange(new Set(), items, 4, 1, isSelectable);
    expect([...result].sort((a, b) => a - b)).toEqual([1, 2, 4]);
  });

  it("selects only the target when the anchor is missing", () => {
    const result = unionSelectionRange(new Set(), items, 99, 4, isSelectable);
    expect([...result]).toEqual([4]);
  });

  it("ignores unselectable targets", () => {
    const selected = new Set([1]);
    expect([
      ...unionSelectionRange(selected, items, 1, 3, isSelectable),
    ]).toEqual([1]);
  });
});

describe("toggleAllSelectable", () => {
  const items = [item(1), item(2, false), item(3), item(-4)];

  it("replaces the selection with every eligible item", () => {
    expect([...toggleAllSelectable(new Set([1]), items, isSelectable)]).toEqual([
      1, 3,
    ]);
    expect(
      [...toggleAllSelectable(new Set([1, 3]), items, isSelectable)],
    ).toEqual([]);
  });

  it("toggles only visible items in toggle-visible mode", () => {
    expect([
      ...toggleAllSelectable(
        new Set([3]),
        [item(1), item(2)],
        isSelectable,
        "toggle-visible",
      ),
    ].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect([
      ...toggleAllSelectable(
        new Set([1, 2, 3]),
        [item(1), item(2)],
        isSelectable,
        "toggle-visible",
      ),
    ]).toEqual([3]);
  });
});

describe("pruneSelection", () => {
  it("keeps only ids that still exist", () => {
    expect([...pruneSelection(new Set([1, 2, 3]), [item(2), item(3)])]).toEqual([
      2, 3,
    ]);
  });
});

describe("chunkIds", () => {
  it("splits ids into batches", () => {
    const ids = Array.from({ length: 1001 }, (_, index) => index + 1);
    const chunks = chunkIds(ids);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(1000);
    expect(chunks[1]).toEqual([1001]);
  });

  it("returns no chunks for an empty selection", () => {
    expect(chunkIds([])).toEqual([]);
  });
});
