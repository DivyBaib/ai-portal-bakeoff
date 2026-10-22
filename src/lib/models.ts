import type { Model } from "../data/schemas";

export const MODEL_SORT_KEYS = [
  "name",
  "vendor",
  "contextWindow",
  "toolCalling",
  "free",
  "requestsPerDay",
  "price",
] as const;

export type ModelSortKey = (typeof MODEL_SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface ModelSortState {
  key: ModelSortKey;
  direction: SortDirection;
}

export interface ModelFilters {
  search: string;
  freeOnly: boolean;
}

const countFormatter = new Intl.NumberFormat("en-US");
const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function nextSortState(
  current: ModelSortState,
  key: ModelSortKey,
): ModelSortState {
  if (current.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: "asc" };
}

export function filterModels(
  models: readonly Model[],
  filters: ModelFilters,
): Model[] {
  const query = filters.search.trim().toLowerCase();
  return models.filter((model) => {
    if (filters.freeOnly && !model.free.available) return false;
    if (query.length === 0) return true;
    return (
      model.name.toLowerCase().includes(query) ||
      model.vendor.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query)
    );
  });
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  direction: SortDirection,
): number {
  // Unknown values always sort last, in both directions.
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareByKey(
  a: Model,
  b: Model,
  state: ModelSortState,
): number {
  const { key, direction } = state;
  switch (key) {
    case "name":
      return direction === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    case "vendor": {
      const byVendor = a.vendor.localeCompare(b.vendor);
      if (byVendor !== 0) return direction === "asc" ? byVendor : -byVendor;
      return a.name.localeCompare(b.name);
    }
    case "contextWindow":
      return compareNullableNumbers(a.contextWindow, b.contextWindow, direction);
    case "toolCalling":
      return compareNullableNumbers(a.toolCalling, b.toolCalling, direction);
    case "free":
      return compareNullableNumbers(
        a.free.available ? 1 : 0,
        b.free.available ? 1 : 0,
        direction,
      );
    case "requestsPerDay":
      return compareNullableNumbers(
        a.free.requestsPerDay,
        b.free.requestsPerDay,
        direction,
      );
    case "price": {
      const byInput = compareNullableNumbers(
        a.price?.inputPerMTok ?? null,
        b.price?.inputPerMTok ?? null,
        direction,
      );
      if (byInput !== 0) return byInput;
      return compareNullableNumbers(
        a.price?.outputPerMTok ?? null,
        b.price?.outputPerMTok ?? null,
        direction,
      );
    }
  }
}

export function sortModels(
  models: readonly Model[],
  state: ModelSortState,
): Model[] {
  return [...models].sort((a, b) => {
    const primary = compareByKey(a, b, state);
    if (primary !== 0) return primary;
    const byName = a.name.localeCompare(b.name);
    return byName !== 0 ? byName : a.id.localeCompare(b.id);
  });
}

/** Formats a count. Unknown (null) is shown as "unknown", never as 0. */
export function formatCount(value: number | null): string {
  return value === null ? "unknown" : countFormatter.format(value);
}

export function formatToolCalling(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Formats the paid price as "input / output" USD per 1M tokens. */
export function formatPrice(price: Model["price"]): string {
  if (price === null) return "unknown";
  return `$${priceFormatter.format(price.inputPerMTok)} / $${priceFormatter.format(price.outputPerMTok)}`;
}
