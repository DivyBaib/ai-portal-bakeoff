import { useState, useMemo, useCallback } from "react";
import type { Model } from "../data/schemas";

interface CompareViewProps {
  models: Model[];
}

const MAX_COMPARE = 3;

function formatNumber(num: number | null): string {
  if (num === null) return "unknown";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatPrice(price: Model["price"]): string {
  if (!price) return "unknown";
  return `$${price.inputPerMTok.toFixed(2)} / $${price.outputPerMTok.toFixed(2)} per 1M`;
}

function formatToolCalling(toolCalling: number): string {
  return `${(toolCalling * 100).toFixed(0)}%`;
}

export function CompareView({ models }: CompareViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableModels = useMemo(() => models.filter(m => !selectedIds.includes(m.id)), [models, selectedIds]);
  const selectedModels = useMemo(() => selectedIds.map(id => models.find(m => m.id === id)!).filter(Boolean), [models, selectedIds]);

  const handleToggleModel = useCallback((modelId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      }
      if (prev.length >= MAX_COMPARE) {
        return prev;
      }
      return [...prev, modelId];
    });
  }, []);

  const handleRemoveModel = useCallback((modelId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== modelId));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const canAddMore = selectedIds.length < MAX_COMPARE;
  const hasEnoughToCompare = selectedIds.length >= 2;

  return (
    <section aria-labelledby="compare-heading" className="w-full max-w-screen-2xl mx-auto">
      <div data-testid="sample-data-banner" className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm" role="status">
        <strong>Sample data:</strong> All scores, limits, and prices are synthetic placeholders, not real measurements.
      </div>

      <div className="mb-6">
        <h2 id="compare-heading" className="text-xl font-semibold mb-4">Compare Models</h2>
        
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700 mb-3">
            Select {hasEnoughToCompare ? "up to " : ""}{MAX_COMPARE} models to compare side by side. 
            {selectedIds.length > 0 && (
              <span className="font-medium text-blue-700">
                {selectedIds.length} of {MAX_COMPARE} selected
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {models.map(model => (
              <button
                key={model.id}
                type="button"
                onClick={() => handleToggleModel(model.id)}
                disabled={!canAddMore && !selectedIds.includes(model.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedIds.includes(model.id)
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                } ${!canAddMore && !selectedIds.includes(model.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-pressed={selectedIds.includes(model.id)}
              >
                {model.name}
                {selectedIds.includes(model.id) && (
                  <span className="ml-1.5" aria-hidden="true">×</span>
                )}
              </button>
            ))}
          </div>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div data-testid="compare-drawer" className="overflow-x-auto">
        {selectedModels.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg">Select 2–3 models to compare</p>
            <p className="mt-1 text-sm">Click model tags above to add them</p>
          </div>
        ) : selectedModels.length === 1 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Select at least one more model</p>
            <p className="mt-1 text-sm">You need 2–3 models to compare</p>
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-sm" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">
                  Attribute
                </th>
                {selectedModels.map(model => (
                  <th key={model.id} scope="col" className="px-4 py-3 text-left font-medium text-gray-700 bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{model.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveModel(model.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded"
                        aria-label={`Remove ${model.name} from comparison`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Vendor</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700">{model.vendor}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Context Window</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700 font-mono">{formatNumber(model.contextWindow)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Tool-Calling Reliability</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700">{formatToolCalling(model.toolCalling)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Free Availability</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      model.free.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {model.free.available ? "Free" : "Paid only"}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Requests/Day (Free)</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700 font-mono">
                    {model.free.requestsPerDay === null ? "unknown" : formatNumber(model.free.requestsPerDay)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Trains on Prompts</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      model.free.trainsOnPrompts ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                    }`}>
                      {model.free.trainsOnPrompts ? "Yes" : "No"}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Price (Input / Output per 1M)</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700 font-mono">{formatPrice(model.price)}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <th scope="row" className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white border-r border-gray-200 z-10">Model ID</th>
                {selectedModels.map(model => (
                  <td key={model.id} className="px-4 py-3 text-gray-700 font-mono text-xs">{model.id}</td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}