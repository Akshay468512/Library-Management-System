import { useEffect, useState } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { api } from "./api";
import AuthScreen from "./components/AuthScreen";
import PerspectiveSelector from "./components/PerspectiveSelector";
import CatalogGrid from "./components/CatalogGrid";
import MyBorrowedBooks from "./components/MyBorrowedBooks";
import AccessPassPanel from "./components/AccessPassPanel";
import OperationsDesk from "./components/OperationsDesk";
import ExecutiveAnalytics from "./components/ExecutiveAnalytics";
import GateScannerTerminal from "./components/GateScannerTerminal";

const USER_STORAGE_KEY = "libraryUser";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [assets, setAssets] = useState([]);
  const [perspective, setPerspective] = useState("member");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCatalog();
    }
  }, [user]);

  const fetchCatalog = () => {
    api
      .get("/api/books")
      .then((response) => setAssets(response.data))
      .catch((error) => console.error("Catalog API error:", error));
  };

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAssets([]);
  };

  const handleLibraryUpdate = () => {
    fetchCatalog();
    setRefreshKey((key) => key + 1);
  };

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 tracking-tight">
            Smart College Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome, {user.name} · USN: <span className="font-mono text-slate-300">{user.usn}</span>
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {perspective === "member" && (
          <div className="space-y-8">
            <MyBorrowedBooks key={refreshKey} user={user} onReturnSuccess={handleLibraryUpdate} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CatalogGrid
                  assets={assets}
                  user={user}
                  onBorrowSuccess={handleLibraryUpdate}
                />
              </div>
              <AccessPassPanel user={user} />
            </div>
          </div>
        )}

        {perspective === "operations" && (
          <div className="space-y-8">
            <OperationsDesk onCatalogRefresh={fetchCatalog} />
            <GateScannerTerminal />
            <CatalogGrid assets={assets} user={user} onBorrowSuccess={handleLibraryUpdate} />
          </div>
        )}

        {perspective === "executive" && (
          <div className="space-y-8">
            <ExecutiveAnalytics />
            <CatalogGrid assets={assets} user={user} onBorrowSuccess={handleLibraryUpdate} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
