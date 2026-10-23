import { useState } from "react";
import { SampleDataBanner } from "./components/SampleDataBanner";
import { CompareView } from "./views/CompareView";
import { ModelsView } from "./views/ModelsView";
import { RankingsView } from "./views/RankingsView";

const VIEWS = [
  { id: "models", label: "Models" },
  { id: "rankings", label: "Rankings" },
  { id: "compare", label: "Compare" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function CurrentView({ view }: { view: ViewId }) {
  switch (view) {
    case "models":
      return <ModelsView />;
    case "rankings":
      return <RankingsView />;
    case "compare":
      return <CompareView />;
  }
}

export default function App() {
  const [view, setView] = useState<ViewId>("models");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Coding Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare AI coding models on quality, capacity and access.
          </p>
          <nav aria-label="Views" className="mt-4">
            <div className="flex flex-wrap gap-2">
              {VIEWS.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setView(item.id)}
                    className={`min-h-10 rounded-md border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                      active
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <SampleDataBanner />
        <CurrentView view={view} />
      </main>
    </div>
  );
}
