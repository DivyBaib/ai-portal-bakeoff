import { useEffect, useState } from "react";
import { loadModels } from "./data/loaders";
import { ModelsView } from "./components/ModelsView";
import type { Model } from "./data/schemas";

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const data = await loadModels();
        if (mounted) {
          setModels(data);
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
          <span>Loading models…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6" role="alert">
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <h1 className="text-lg font-semibold mb-2">Failed to load models</h1>
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
      <ModelsView models={models} />
    </main>
  );
}

export default App;