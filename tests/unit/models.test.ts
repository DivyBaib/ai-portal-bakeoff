import { describe, expect, it } from "vitest";
import { models } from "../../src/data/loaders";
import {
  filterModels,
  formatCount,
  formatPrice,
  formatToolCalling,
  MODEL_SORT_KEYS,
  nextSortState,
  sortModels,
  type ModelSortKey,
} from "../../src/lib/models";

const allModels = { search: "", freeOnly: false };

describe("filterModels", () => {
  it("returns every model by default", () => {
    expect(filterModels(models, allModels)).toHaveLength(6);
  });

  it("filters to free models only", () => {
    const result = filterModels(models, { ...allModels, freeOnly: true });
    expect(result).toHaveLength(5);
    expect(result.map((model) => model.id)).not.toContain(
      "sample-paid-frontier",
    );
  });

  it("searches name, vendor and id case-insensitively", () => {
    expect(
      filterModels(models, { ...allModels, search: "  nviDIA " }).map(
        (model) => model.id,
      ),
    ).toEqual(["nemotron-3-ultra"]);
    expect(
      filterModels(models, { ...allModels, search: "mimo" }).map(
        (model) => model.id,
      ),
    ).toEqual(["mimo-v2-5"]);
    expect(
      filterModels(models, { ...allModels, search: "flash" }),
    ).toHaveLength(2);
  });

  it("combines search and the free-only filter", () => {
    expect(
      filterModels(models, { search: "sample", freeOnly: true }),
    ).toHaveLength(0);
  });
});

describe("sortModels", () => {
  function sorted(key: ModelSortKey, direction: "asc" | "desc" = "asc") {
    return sortModels(models, { key, direction });
  }

  it("sorts every listed column", () => {
    for (const key of MODEL_SORT_KEYS) {
      const ascending = sorted(key, "asc");
      const descending = sorted(key, "desc");
      expect(ascending).toHaveLength(models.length);
      expect(descending).toHaveLength(models.length);
      expect(new Set(ascending.map((model) => model.id)).size).toBe(
        models.length,
      );
    }
  });

  it("sorts names and vendors alphabetically", () => {
    const names = sorted("name").map((model) => model.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const vendors = sorted("vendor").map((model) => model.vendor);
    expect(vendors).toEqual([...vendors].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts numeric columns in both directions", () => {
    const contextAsc = sorted("contextWindow").map(
      (model) => model.contextWindow,
    );
    expect(contextAsc).toEqual([...contextAsc].sort((a, b) => a - b));

    const toolDesc = sorted("toolCalling", "desc").map(
      (model) => model.toolCalling,
    );
    expect(toolDesc).toEqual([...toolDesc].sort((a, b) => b - a));

    const contextDesc = sorted("contextWindow", "desc");
    expect(contextDesc[0]?.contextWindow).toBe(1000000);
    expect(contextDesc.at(-1)?.contextWindow).toBe(128000);
  });

  it("sorts free availability with paid models first when ascending", () => {
    expect(sorted("free")[0]?.id).toBe("sample-paid-frontier");
    expect(sorted("free", "desc")[0]?.free.available).toBe(true);
  });

  it("keeps unknown request limits last in both directions", () => {
    const asc = sorted("requestsPerDay");
    expect(asc.slice(0, 5).map((model) => model.free.requestsPerDay)).toEqual([
      20, 50, 300, 400, 500,
    ]);
    expect(asc.at(-1)?.free.requestsPerDay).toBeNull();

    const desc = sorted("requestsPerDay", "desc");
    expect(desc.slice(0, 5).map((model) => model.free.requestsPerDay)).toEqual([
      500, 400, 300, 50, 20,
    ]);
    expect(desc.at(-1)?.free.requestsPerDay).toBeNull();
  });

  it("sorts prices ascending with unknown prices last", () => {
    const result = sorted("price");
    expect(result.slice(0, 4).map((model) => model.price?.inputPerMTok)).toEqual(
      [0.1, 0.2, 0.75, 3],
    );
    expect(result.slice(4).map((model) => model.price)).toEqual([null, null]);
  });
});

describe("nextSortState", () => {
  it("switches column and direction", () => {
    expect(nextSortState({ key: "name", direction: "asc" }, "vendor")).toEqual({
      key: "vendor",
      direction: "asc",
    });
    expect(nextSortState({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
    expect(nextSortState({ key: "name", direction: "desc" }, "name")).toEqual({
      key: "name",
      direction: "asc",
    });
  });
});

describe("formatting", () => {
  it("renders unknown values as unknown, never 0", () => {
    expect(formatCount(null)).toBe("unknown");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1000000)).toBe("1,000,000");
    expect(formatPrice(null)).toBe("unknown");
  });

  it("renders tool calling and prices", () => {
    expect(formatToolCalling(0.85)).toBe("85%");
    expect(formatPrice({ inputPerMTok: 0.2, outputPerMTok: 0.8 })).toBe(
      "$0.20 / $0.80",
    );
  });
});
