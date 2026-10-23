import { useMemo, useState } from "react";
import { MetricBar } from "../components/MetricBar";
import { models, sources } from "../data/loaders";
import type { Model } from "../data/schemas";
import {
  buildRankInput,
  formatConfidence,
  formatScore,
  formatWeight,
  getSourceContributions,
} from "../lib/ranking";
import {
  computeSourceWeights,
  rankModels,
  type Mode,
  type RankedModel,
} from "../lib/scoring";

const rankInput = buildRankInput(models, sources);
const sourceWeights = computeSourceWeights(rankInput);
const modelById = new Map(models.map((model) => [model.id, model]));

interface RankingItemProps {
  ranked: RankedModel;
  rank: number;
  model: Model | undefined;
  selected: boolean;
  onSelect: (id: string) => void;
}

function RankingItem({
  ranked,
  rank,
  model,
  selected,
  onSelect,
}: RankingItemProps) {
  const select = () => onSelect(ranked.id);
  return (
    <li
      data-testid="ranking-item"
      data-model-id={ranked.id}
      onClick={select}
      className={`rounded-lg border bg-white shadow-sm transition-colors ${
        selected
          ? "border-sky-500 ring-2 ring-sky-200"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          select();
        }}
        className="w-full rounded-lg px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold tabular-nums text-slate-700"
            >
              {rank}
            </span>
            <span className="min-w-0">
              <span className="sr-only">Rank {rank}: </span>
              <span className="block truncate font-medium text-slate-900">
                {model?.name ?? ranked.id}
              </span>
              <span className="block truncate text-xs text-slate-600">
                {model?.vendor ?? "Unknown vendor"}
              </span>
            </span>
          </div>
          <span className="shrink-0 text-right">
            <span className="block text-2xl font-semibold tabular-nums text-slate-900">
              {formatScore(ranked.score)}
            </span>
            <span className="block text-xs text-slate-600">
              confidence {formatConfidence(ranked.confidence)}
            </span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <MetricBar label="Quality" value={ranked.breakdown.quality} />
          <MetricBar label="Capacity" value={ranked.breakdown.capacity} />
          <MetricBar label="Access" value={ranked.breakdown.access} />
        </div>
      </button>
    </li>
  );
}

interface WhyPanelProps {
  model: Model;
  ranked: RankedModel;
  onClose: () => void;
}

function WhyPanel({ model, ranked, onClose }: WhyPanelProps) {
  const contributions = getSourceContributions(model, sources, sourceWeights);

  return (
    <section
      data-testid="why-panel"
      aria-labelledby="why-panel-heading"
      className="h-fit min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="why-panel-heading" className="text-lg font-semibold">
            Why this rank
          </h3>
          <p className="mt-1 text-sm text-slate-600">{model.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          Close
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-600">Final score</dt>
          <dd className="text-xl font-semibold tabular-nums">
            {formatScore(ranked.score)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">Confidence</dt>
          <dd className="text-xl font-semibold tabular-nums">
            {formatConfidence(ranked.confidence)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <MetricBar label="Quality" value={ranked.breakdown.quality} />
        <MetricBar label="Capacity" value={ranked.breakdown.capacity} />
        <MetricBar label="Access" value={ranked.breakdown.access} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Score = 55% quality + 20% capacity + 25% access.
      </p>

      <h4 className="mt-5 text-sm font-semibold">Source contributions</h4>
      <table className="mt-2 w-full border-collapse text-sm">
        <caption className="sr-only">
          Each source's weight in the ranking and the score it gave{" "}
          {model.name}.
        </caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-600">
            <th scope="col" className="py-1 pr-2 text-left font-medium">
              Source
            </th>
            <th scope="col" className="px-2 py-1 text-right font-medium">
              Weight
            </th>
            <th scope="col" className="py-1 pl-2 text-right font-medium">
              Score
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contributions.map((contribution) => (
            <tr
              key={contribution.id}
              data-testid="why-source-row"
              data-source-id={contribution.id}
            >
              <th
                scope="row"
                className="py-2 pr-2 text-left font-normal text-slate-800"
              >
                {contribution.name}
              </th>
              <td className="px-2 py-2 text-right tabular-nums text-slate-700">
                {formatWeight(contribution.weight)}
              </td>
              <td
                className={`py-2 pl-2 text-right tabular-nums ${
                  contribution.score === null
                    ? "text-slate-500"
                    : "text-slate-700"
                }`}
              >
                {contribution.score === null
                  ? "not scored"
                  : formatScore(contribution.score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-600">
        Weight = reliability × relevance × freshness × coverage (the share of
        all models scored by that source).
      </p>
    </section>
  );
}

export function RankingsView() {
  const [mode, setMode] = useState<Mode>("free-only");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranked = useMemo(() => rankModels(rankInput, mode), [mode]);
  const selectedRanked =
    selectedId === null
      ? undefined
      : ranked.find((item) => item.id === selectedId);
  const selectedModel =
    selectedRanked === undefined ? undefined : modelById.get(selectedRanked.id);

  return (
    <section aria-labelledby="rankings-heading" className="space-y-5">
      <div>
        <h2 id="rankings-heading" className="text-xl font-semibold">
          Rankings
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Weighted by source reliability, relevance, freshness and coverage,
          then combined with capacity and access.
        </p>
      </div>

      <fieldset
        data-testid="mode-toggle"
        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      >
        <legend className="px-1 text-sm font-medium text-slate-700">
          Ranking mode
        </legend>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              data-testid="mode-option-free-only"
              type="radio"
              name="ranking-mode"
              value="free-only"
              checked={mode === "free-only"}
              onChange={() => setMode("free-only")}
              className="h-4 w-4 accent-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            />
            Free-tier only
          </label>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              data-testid="mode-option-mixed"
              type="radio"
              name="ranking-mode"
              value="mixed"
              checked={mode === "mixed"}
              onChange={() => setMode("mixed")}
            />
            Free + paid
          </label>
        </div>
      </fieldset>

      <p aria-live="polite" className="text-sm text-slate-600">
        {ranked.length} model{ranked.length === 1 ? "" : "s"} eligible.{" "}
        {mode === "free-only"
          ? "Models without a free tier are excluded."
          : "Paid-only models are included using their token price."}
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ol
          data-testid="rankings-list"
          aria-label="Models ranked best first"
          className="min-w-0 space-y-3"
        >
          {ranked.map((item, index) => (
            <RankingItem
              key={item.id}
              ranked={item}
              rank={index + 1}
              model={modelById.get(item.id)}
              selected={item.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </ol>

        {selectedRanked !== undefined && selectedModel !== undefined ? (
          <WhyPanel
            model={selectedModel}
            ranked={selectedRanked}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <p className="h-fit rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
            Select a ranked model to see why it placed where it did.
          </p>
        )}
      </div>
    </section>
  );
}
