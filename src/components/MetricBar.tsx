import { formatScore } from "../lib/ranking";

interface MetricBarProps {
  label: string;
  /** A 0..100 score. Values outside the range are clamped for the bar. */
  value: number;
}

export function MetricBar({ label, value }: MetricBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-medium tabular-nums text-slate-800">
          {formatScore(value)}
        </span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-sky-600"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
