import { BookOpen } from "lucide-react";

export default function CatalogGrid({ assets }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold tracking-wide">Live Asset Catalog</h2>
      </div>

      {assets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
          No catalog assets found. Verify Firestore connectivity and ensure the API tier is online.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-xl"
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <h3 className="font-bold text-lg text-slate-100 line-clamp-1">
                  {asset.title || "Untitled Asset"}
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider shadow-inner ${
                    asset.isAvailable
                      ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/60"
                      : "bg-rose-950/50 text-rose-400 border border-rose-800/60"
                  }`}
                >
                  {asset.isAvailable ? "Available" : "On Loan"}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">
                <span className="text-slate-600 font-medium">Author:</span>{" "}
                {asset.author || "Unknown"}
              </p>
              <p className="text-slate-500 text-xs mb-2">
                <span className="text-slate-600 font-medium">ISBN:</span> {asset.isbn || "N/A"}
              </p>
              <p className="text-slate-600 text-xs font-mono truncate">
                Asset ID: {asset.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
