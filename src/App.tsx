import { useEffect, useState } from "react";
import { loadModels, loadSources } from "./data/loaders";
import { ModelsView } from "./components/ModelsView";
import { RankingsView } from "./components/RankingsView";
import { CompareView } from "./components/CompareView";
import type { Model, Source } from "./data/schemas";

type View = "models" | "rankings" | "compare";

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>("models");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [modelsData, sourcesData] = await Promise.all([
          loadModels(),
          loadSources(),
        ]);
        if (mounted) {
          setModels(modelsData);
          setSources(sourcesData);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="p-6" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading data…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6" role="alert">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <h1 className="text-lg font-semibold mb-2">Failed to load data</h1>
          <pre className="text-sm whitespace-pre-wrap">{error.message}</pre>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Coding Portal</h1>
        <p className="mt-2 text-gray-600">Compare and rank AI coding models</p>
      </header>

      <nav className="mb-6" aria-label="Main navigation">
        <div className="flex gap-2 border-b border-gray-200" role="tablist">
          <button
            role="tab"
            aria-selected={activeView === "models"}
            aria-controls="models-panel"
            id="models-tab"
            onClick={() => setActiveView("models")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === "models"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Models
          </button>
          <button
            role="tab"
            aria-selected={activeView === "rankings"}
            aria-controls="rankings-panel"
            id="rankings-tab"
            onClick={() => setActiveView("rankings")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === "rankings"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Rankings
          </button>
          <button
            role="tab"
            aria-selected={activeView === "compare"}
            aria-controls="compare-panel"
            id="compare-tab"
            onClick={() => setActiveView("compare")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === "compare"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Compare
          </button>
        </div>
      </nav>

      <div role="tabpanel" id="models-panel" aria-labelledby="models-tab" hidden={activeView !== "models"}>
        <ModelsView models={models} />
      </div>

      <div role="tabpanel" id="rankings-panel" aria-labelledby="rankings-tab" hidden={activeView !== "rankings"}>
        <RankingsView models={models} sources={sources} />
      </div>

      <div role="tabpanel" id="compare-panel" aria-labelledby="compare-tab" hidden={activeView !== "compare"}>
        <CompareView models={models} />
      </div>
    </main>
  );
}

export default App;