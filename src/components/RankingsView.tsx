import { useState, useMemo, useCallback } from "react";
import type { Model } from "../data/schemas";
import { rankModels, computeSourceWeights, type RankInput, type Mode } from "../lib/scoring";

interface RankingsViewProps {
  models: Model[];
  sources: Array<{ id: string; name: string; reliability: number; relevance: number; ageDays: number }>;
}

function modelToRankInput(model: Model): RankInput["models"][0] {
  return {
    id: model.id,
    scores: model.scores,
    contextWindow: model.contextWindow,
    toolCalling: model.toolCalling,
    free: {
      available: model.free.available,
      requestsPerDay: model.free.requestsPerDay,
      trainsOnPrompts: model.free.trainsOnPrompts,
    },
    price: model.price,
  };
}

function sourceToRankInput(source: RankingsViewProps["sources"][0]): RankInput["sources"][0] {
  return {
    id: source.id,
    reliability: source.reliability,
    relevance: source.relevance,
    ageDays: source.ageDays,
  };
}

export function RankingsView({ models, sources }: RankingsViewProps) {
  const [mode, setMode] = useState<Mode>("free-only");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const rankInput = useMemo<RankInput>(() => ({
    models: models.map(modelToRankInput),
    sources: sources.map(sourceToRankInput),
  }), [models, sources]);

  const rankedModels = useMemo(() => rankModels(rankInput, mode), [rankInput, mode]);
  const sourceWeights = useMemo(() => computeSourceWeights(rankInput), [rankInput]);

  const selectedRankedModel = useMemo(() => 
    rankedModels.find(m => m.id === selectedModelId) ?? null, 
    [rankedModels, selectedModelId]
  );

  const selectedModel = useMemo(() => 
    models.find(m => m.id === selectedModelId) ?? null, 
    [models, selectedModelId]
  );

  const handleRankingItemClick = useCallback((modelId: string) => {
    setSelectedModelId(prev => prev === modelId ? null : modelId);
  }, []);

  const formatScore = (score: number): string => score.toFixed(1);
  const formatConfidence = (confidence: number): string => (confidence * 100).toFixed(0) + "%";
  const formatWeight = (weight: number): string => weight.toFixed(4);

  return (
    <section aria-labelledby="rankings-heading" className="w-full max-w-screen-2xl mx-auto">
      <div data-testid="sample-data-banner" className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm" role="status">
        <strong>Sample data:</strong> All scores, limits, and prices are synthetic placeholders, not real measurements.
      </div>

      <div className="mb-6">
        <h2 id="rankings-heading" className="text-xl font-semibold mb-4">Rankings</h2>
        
        <div data-testid="mode-toggle" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200" role="radiogroup" aria-label="Ranking mode">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="mode-option-free-only"
              type="radio"
              name="ranking-mode"
              value="free-only"
              checked={mode === "free-only"}
              onChange={() => setMode("free-only")}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              data-testid="mode-option-free-only"
            />
            <span className="text-sm font-medium">Free-tier only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="mode-option-mixed"
              type="radio"
              name="ranking-mode"
              value="mixed"
              checked={mode === "mixed"}
              onChange={() => setMode("mixed")}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              data-testid="mode-option-mixed"
            />
            <span className="text-sm font-medium">Free + paid</span>
          </label>
          <span className="ml-auto text-sm text-gray-500">
            {rankedModels.length} model{rankedModels.length !== 1 ? "s" : ""} ranked
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <div data-testid="rankings-list" className="space-y-2" role="list" aria-label="Ranked models">
            {rankedModels.map((ranked, index) => (
              <article
                key={ranked.id}
                data-testid="ranking-item"
                data-model-id={ranked.id}
                onClick={() => handleRankingItemClick(ranked.id)}
                className={`group p-4 bg-white border border-gray-200 rounded-lg cursor-pointer transition-all ${
                  selectedModelId === ranked.id 
                    ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                    : "hover:bg-gray-50 hover:border-gray-300"
                }`}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRankingItemClick(ranked.id);
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-bold text-gray-700">
                    #{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{selectedModel?.name ?? models.find(m => m.id === ranked.id)?.name ?? ranked.id}</h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap">ID: {ranked.id}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-blue-700">Score:</span>
                        <span className="font-mono text-gray-900">{formatScore(ranked.score)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-green-700">Confidence:</span>
                        <span className="font-mono text-gray-900">{formatConfidence(ranked.confidence)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>Quality: <span className="font-mono font-medium">{formatScore(ranked.breakdown.quality)}</span></span>
                      <span>Capacity: <span className="font-mono font-medium">{formatScore(ranked.breakdown.capacity)}</span></span>
                      <span>Access: <span className="font-mono font-medium">{formatScore(ranked.breakdown.access)}</span></span>
                    </div>
                  </div>
                  <svg className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </article>
            ))}
            {rankedModels.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No models match the current mode.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selectedRankedModel && selectedModel && (
            <aside data-testid="why-panel" className="sticky top-24 p-4 bg-gray-50 border border-gray-200 rounded-lg" aria-labelledby="why-heading">
              <h3 id="why-heading" className="font-semibold text-gray-900 mb-4">Why this rank?</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Source weights and scores</h4>
                  <div className="space-y-2 text-sm">
                    {sources.map(source => {
                      const weight = sourceWeights[source.id] ?? 0;
                      const modelScore = selectedModel.scores[source.id];
                      return (
                        <div key={source.id} className="p-2 bg-white rounded border border-gray-200">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900">{source.name}</span>
                            <span className="font-mono text-gray-600">{formatWeight(weight)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>Reliability: {source.reliability}</span>
                            <span>Relevance: {source.relevance}</span>
                            <span>Age: {source.ageDays}d</span>
                            <span>Model score: {modelScore !== undefined ? modelScore : "—"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Breakdown</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-600">Quality</dt>
                    <dd className="font-mono font-medium text-gray-900">{formatScore(selectedRankedModel.breakdown.quality)}</dd>
                    <dt className="text-gray-600">Capacity</dt>
                    <dd className="font-mono font-medium text-gray-900">{formatScore(selectedRankedModel.breakdown.capacity)}</dd>
                    <dt className="text-gray-600">Access</dt>
                    <dd className="font-mono font-medium text-gray-900">{formatScore(selectedRankedModel.breakdown.access)}</dd>
                    <dt className="text-gray-600">Final Score</dt>
                    <dd className="font-mono font-medium text-blue-700">{formatScore(selectedRankedModel.score)}</dd>
                    <dt className="text-gray-600">Confidence</dt>
                    <dd className="font-mono font-medium text-green-700">{formatConfidence(selectedRankedModel.confidence)}</dd>
                  </dl>
                </div>
              </div>
            </aside>
          )}
          {(!selectedRankedModel || !selectedModel) && (
            <aside className="sticky top-24 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
              <p>Select a model from the list to see why it ranked this way.</p>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}