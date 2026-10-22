import { useId, useState } from "react";
import { models } from "../data/loaders";
import {
  filterModels,
  formatCount,
  formatPrice,
  formatToolCalling,
  nextSortState,
  sortModels,
  type ModelSortKey,
  type ModelSortState,
} from "../lib/models";

interface SortableHeaderProps {
  label: string;
  sortKey: ModelSortKey;
  sort: ModelSortState;
  onSort: (key: ModelSortKey) => void;
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: SortableHeaderProps) {
  const active = sort.key === sortKey;
  const indicator = active ? (sort.direction === "asc" ? "↑" : "↓") : "↕";
  return (
    <th
      scope="col"
      aria-sort={
        active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
      }
      className="whitespace-nowrap px-3 py-2 text-left font-semibold"
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex w-full items-center gap-1 rounded text-left hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-xs text-slate-500">
          {indicator}
        </span>
      </button>
    </th>
  );
}

export function ModelsView() {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<ModelSortState>({
    key: "name",
    direction: "asc",
  });

  const visibleModels = sortModels(
    filterModels(models, { search, freeOnly }),
    sort,
  );

  const handleSort = (key: ModelSortKey) => {
    setSort((current) => nextSortState(current, key));
  };

  return (
    <section aria-labelledby="models-heading" className="space-y-4">
      <div>
        <h2 id="models-heading" className="text-xl font-semibold">
          Models
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compare context, tool calling, free access and paid pricing. Select a
          column heading to sort.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label
              htmlFor={searchId}
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Search models
            </label>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, vendor or id"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 sm:w-64"
            />
          </div>
          <label className="flex min-h-10 items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(event) => setFreeOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            />
            Free only
          </label>
        </div>
        <p aria-live="polite" className="text-sm text-slate-600">
          Showing {visibleModels.length} of {models.length} models
        </p>
      </div>

      {visibleModels.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No models match the current search and filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table
            data-testid="models-table"
            className="w-full min-w-[52rem] border-collapse text-sm"
          >
            <caption className="sr-only">
              AI coding models with context window, tool-calling reliability,
              free availability, daily request limits and paid price.
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <SortableHeader
                  label="Name"
                  sortKey="name"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Vendor"
                  sortKey="vendor"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Context window"
                  sortKey="contextWindow"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Tool-calling reliability"
                  sortKey="toolCalling"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Free availability"
                  sortKey="free"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Requests / day"
                  sortKey="requestsPerDay"
                  sort={sort}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Price (USD in / out per 1M)"
                  sortKey="price"
                  sort={sort}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleModels.map((model) => (
                <tr
                  key={model.id}
                  data-testid="model-row"
                  data-model-id={model.id}
                  className="hover:bg-slate-50"
                >
                  <th
                    scope="row"
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-slate-900"
                  >
                    {model.name}
                  </th>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {model.vendor}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700">
                    {formatCount(model.contextWindow)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700">
                    {formatToolCalling(model.toolCalling)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {model.free.available ? "Yes" : "No"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700">
                    {formatCount(model.free.requestsPerDay)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700">
                    {formatPrice(model.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
