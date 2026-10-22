export function SampleDataBanner() {
  return (
    <div
      data-testid="sample-data-banner"
      role="note"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <strong className="font-semibold">Sample data.</strong>{" "}
      <span>
        Every model, price and benchmark score below is synthetic placeholder
        data for development. It is not a real measurement and must not be used
        to make a purchasing decision.
      </span>
    </div>
  );
}
