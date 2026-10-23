import { useState, useMemo, useCallback } from "react";
import type { Model } from "../data/schemas";

type SortColumn = "name" | "vendor" | "contextWindow" | "toolCalling" | "freeAvailable" | "freeRequests" | "price";
type SortDirection = "asc" | "desc";

interface ModelsViewProps {
  models: Model[];
}

export function ModelsView({ models }: ModelsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = useCallback((column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  const filteredAndSortedModels = useMemo(() => {
    let result = models;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.vendor.toLowerCase().includes(query) ||
          model.id.toLowerCase().includes(query),
      );
    }

    // Free only filter
    if (freeOnly) {
      result = result.filter((model) => model.free.available);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "vendor":
          aVal = a.vendor;
          bVal = b.vendor;
          break;
        case "contextWindow":
          aVal = a.contextWindow;
          bVal = b.contextWindow;
          break;
        case "toolCalling":
          aVal = a.toolCalling;
          bVal = b.toolCalling;
          break;
        case "freeAvailable":
          aVal = a.free.available ? 1 : 0;
          bVal = b.free.available ? 1 : 0;
          break;
        case "freeRequests":
          aVal = a.free.requestsPerDay ?? -1;
          bVal = b.free.requestsPerDay ?? -1;
          break;
        case "price":
          aVal = a.price ? a.price.inputPerMTok : Number.MAX_SAFE_INTEGER;
          bVal = b.price ? b.price.inputPerMTok : Number.MAX_SAFE_INTEGER;
          break;
        default:
          return 0;
      }

      if (aVal === bVal) return 0;
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [models, searchQuery, freeOnly, sortColumn, sortDirection]);

  const formatNumber = (num: number | null): string => {
    if (num === null) return "unknown";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPrice = (price: Model["price"]): string => {
    if (!price) return "unknown";
    return `$${price.inputPerMTok.toFixed(2)} / $${price.outputPerMTok.toFixed(2)} per 1M`;
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <section aria-labelledby="models-heading" className="w-full max-w-screen-2xl mx-auto">
      <div data-testid="sample-data-banner" className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm" role="status">
        <strong>Sample data:</strong> All scores, limits, and prices are synthetic placeholders, not real measurements.
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 id="models-heading" className="text-xl font-semibold">
          Models
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <label htmlFor="search-input" className="sr-only">
            Search models
          </label>
          <input
            id="search-input"
            type="search"
            placeholder="Search by name, vendor, or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            data-testid="search-input"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Free only</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table data-testid="models-table" className="w-full text-sm" role="grid">
          <thead className="bg-gray-50">
            <tr>
              {[
                { key: "name", label: "Name" },
                { key: "vendor", label: "Vendor" },
                { key: "contextWindow", label: "Context Window" },
                { key: "toolCalling", label: "Tool-Calling Reliability" },
                { key: "freeAvailable", label: "Free Availability" },
                { key: "freeRequests", label: "Requests/Day" },
                { key: "price", label: "Price (Input / Output per 1M)" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort(key as SortColumn)}
                >
                  <span className="flex items-center gap-1">
                    {label}
                    {getSortIndicator(key as SortColumn)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedModels.map((model) => (
              <tr
                key={model.id}
                data-testid="model-row"
                data-model-id={model.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{model.name}</td>
                <td className="px-4 py-3 text-gray-700">{model.vendor}</td>
                <td className="px-4 py-3 text-gray-700 font-mono">{formatNumber(model.contextWindow)}</td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    {(model.toolCalling * 100).toFixed(0)}%
                    <span className="text-xs text-gray-500">({model.toolCalling.toFixed(2)})</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      model.free.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {model.free.available ? "Free" : "Paid only"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 font-mono">
                  {model.free.requestsPerDay === null ? "unknown" : formatNumber(model.free.requestsPerDay)}
                </td>
                <td className="px-4 py-3 text-gray-700 font-mono">{formatPrice(model.price)}</td>
              </tr>
            ))}
            {filteredAndSortedModels.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No models match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm text-gray-500">
        Showing {filteredAndSortedModels.length} of {models.length} models
      </p>
    </section>
  );
}