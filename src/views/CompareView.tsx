import { useState } from "react";
import { MetricBar } from "../components/MetricBar";
import { models, sources } from "../data/loaders";
import type { Model } from "../data/schemas";
import {
  formatCount,
  formatPrice,
  formatToolCalling,
} from "../lib/models";
import {
  buildRankInput,
  formatConfidence,
  formatScore,
  MAX_COMPARE_MODELS,
  MIN_COMPARE_MODELS,
  toggleCompareSelection,
} from "../lib/ranking";
import { rankModels, type RankedModel } from "../lib/scoring";

const rankInput = buildRankInput(models, sources);
const freeOnlyById = new Map(
  rankModels(rankInput, "free-only").map((item) => [item.id, item]),
);
const mixedById = new Map(
  rankModels(rankInput, "mixed").map((item) => [item.id, item]),
);
const modelById = new Map(models.map((model) => [model.id, model]));

function Fact({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-slate-900">
        {children}
      </dd>
    </div>
  );
}

function ScoreLine({ ranked }: { ranked: RankedModel | undefined }) {
  if (ranked === undefined) {
    return <p className="text-sm text-slate-600">Not eligible in this mode.</p>;
  }
  return (
    <p className="text-sm text-slate-800">
      <span className="text-xl font-semibold tabular-nums">
        {formatScore(ranked.score)}
      </span>{" "}
      <span className="text-xs text-slate-600">
        confidence {formatConfidence(ranked.confidence)}
      </span>
    </p>
  );
}

function CompareCard({ model }: { model: Model }) {
  const freeOnly = freeOnlyById.get(model.id);
  const mixed = mixedById.get(model.id);

  return (
    <article
      data-testid="compare-column"
      data-model-id={model.id}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <header>
        <h4 className="font-semibold text-slate-900">{model.name}</h4>
        <p className="text-xs text-slate-600">{model.vendor}</p>
      </header>

      <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
        <Fact label="Context window">{formatCount(model.contextWindow)}</Fact>
        <Fact label="Tool calling">{formatToolCalling(model.toolCalling)}</Fact>
        <Fact label="Free tier">{model.free.available ? "Yes" : "No"}</Fact>
        <Fact label="Requests / day">
          {formatCount(model.free.requestsPerDay)}
        </Fact>
        <Fact label="Price (in / out)">{formatPrice(model.price)}</Fact>
      </dl>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
        <div>
          <h5 className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Free-tier score
          </h5>
          <ScoreLine ranked={freeOnly} />
        </div>
        <div>
          <h5 className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Free + paid score
          </h5>
          <ScoreLine ranked={mixed} />
          {mixed !== undefined ? (
            <div className="mt-2 space-y-2">
              <MetricBar label="Quality" value={mixed.breakdown.quality} />
              <MetricBar label="Capacity" value={mixed.breakdown.capacity} />
              <MetricBar label="Access" value={mixed.breakdown.access} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function CompareView() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedModels = selectedIds
    .map((id) => modelById.get(id))
    .filter((model): model is Model => model !== undefined);
  const atLimit = selectedIds.length >= MAX_COMPARE_MODELS;
  const remaining = MIN_COMPARE_MODELS - selectedModels.length;

  return (
    <section aria-labelledby="compare-heading" className="space-y-5">
      <div>
        <h2 id="compare-heading" className="text-xl font-semibold">
          Compare
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Pick two or three models to see their facts and scores side by side.
        </p>
      </div>

      <fieldset className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Models to compare
        </legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => {
            const checked = selectedIds.includes(model.id);
            const disabled = !checked && atLimit;
            return (
              <label
                key={model.id}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm ${
                  disabled
                    ? "cursor-not-allowed bg-slate-50 text-slate-500"
                    : "bg-white text-slate-800 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() =>
                    setSelectedIds((current) =>
                      toggleCompareSelection(current, model.id),
                    )
                  }
                  className="h-4 w-4 shrink-0 accent-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {model.name}
                  </span>
                  <span className="block truncate text-xs text-slate-600">
                    {model.vendor}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p aria-live="polite" className="mt-2 text-sm text-slate-600">
          {selectedModels.length} of {MAX_COMPARE_MODELS} selected.{" "}
          {remaining > 0
            ? `Select ${remaining} more model${remaining === 1 ? "" : "s"} to compare.`
            : atLimit
              ? "Maximum reached."
              : ""}
        </p>
      </fieldset>

      <section
        data-testid="compare-drawer"
        aria-labelledby="compare-results-heading"
        className="rounded-lg border border-slate-200 bg-slate-100/60 p-3 sm:p-4"
      >
        <h3 id="compare-results-heading" className="text-lg font-semibold">
          Side by side
        </h3>
        {selectedModels.length < MIN_COMPARE_MODELS ? (
          <p className="mt-2 text-sm text-slate-600">
            Select at least two models to start the comparison.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {selectedModels.map((model) => (
              <CompareCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
