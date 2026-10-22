import { SampleDataBanner } from "./components/SampleDataBanner";
import { ModelsView } from "./views/ModelsView";

export default function App() {
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <SampleDataBanner />
        <ModelsView />
      </main>
    </div>
  );
}
