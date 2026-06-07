import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "./api";
import PerspectiveSelector from "./components/PerspectiveSelector";
import CatalogGrid from "./components/CatalogGrid";
import AccessPassPanel from "./components/AccessPassPanel";
import OperationsDesk from "./components/OperationsDesk";
import ExecutiveAnalytics from "./components/ExecutiveAnalytics";
import GateScannerTerminal from "./components/GateScannerTerminal";

function App() {
  const [assets, setAssets] = useState([]);
  const [perspective, setPerspective] = useState("member");

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = () => {
    api
      .get("/api/books")
      .then((response) => setAssets(response.data))
      .catch((error) => console.error("Catalog API error:", error));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
            Smart College Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Campus Library Platform — Library Management System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PerspectiveSelector
            activePerspective={perspective}
            onPerspectiveChange={setPerspective}
          />
          <button
            onClick={fetchCatalog}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh catalog"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {perspective === "member" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <CatalogGrid assets={assets} />
            </div>
            <AccessPassPanel />
          </div>
        )}

        {perspective === "operations" && (
          <div className="space-y-8">
            <OperationsDesk onCatalogRefresh={fetchCatalog} />
            <GateScannerTerminal />
            <CatalogGrid assets={assets} />
          </div>
        )}

        {perspective === "executive" && (
          <div className="space-y-8">
            <ExecutiveAnalytics />
            <CatalogGrid assets={assets} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
