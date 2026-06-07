import { useEffect, useState } from "react";
import { BarChart3, BookOpen, AlertCircle, CircleDollarSign, RefreshCw } from "lucide-react";
import { api } from "../api";

function MetricCard({ icon: Icon, label, value, subtext, accent = "blue" }) {
  const accents = {
    blue: "text-blue-400 border-blue-800/40 bg-blue-950/30",
    emerald: "text-emerald-400 border-emerald-800/40 bg-emerald-950/30",
    rose: "text-rose-400 border-rose-800/40 bg-rose-950/30",
    amber: "text-amber-400 border-amber-800/40 bg-amber-950/30",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xl ${accents[accent]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${accents[accent].split(" ")[0]}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-extrabold text-slate-100">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}

function ProgressBar({ label, value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {value} / {max} ({pct}%)
        </span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ExecutiveAnalytics() {
  const [stats, setStats] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    setLoading(true);
    setError("");

    Promise.all([api.get("/api/analytics"), api.get("/api/fines?status=unpaid")])
      .then(([analyticsRes, finesRes]) => {
        setStats(analyticsRes.data);
        setPenalties(finesRes.data);
      })
      .catch((err) => {
        setError("Unable to load library reports.");
        console.error("Analytics error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
        Loading library statistics...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-8 text-center text-rose-300">
        {error || "Analytics service unavailable."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <h2 className="text-xl font-bold tracking-wide">Library Reports</h2>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={BookOpen}
          label="Total Books"
          value={stats.totalAssets}
          subtext={`${stats.availableAssets} available on shelf`}
          accent="blue"
        />
        <MetricCard
          icon={BookOpen}
          label="Books Checked Out"
          value={stats.checkedOutAssets}
          subtext={`${stats.checkoutRatio}% utilization rate`}
          accent="emerald"
        />
        <MetricCard
          icon={AlertCircle}
          label="Overdue Books"
          value={stats.overdueCount}
          subtext={`of ${stats.activeLoans} active loans`}
          accent="rose"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Unpaid Fines"
          value={`${stats.outstandingPenaltiesAmount} units`}
          subtext={`${stats.outstandingPenaltiesCount} open fine records`}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Book Checkout Summary
          </h3>
          <ProgressBar
            label="Checked Out"
            value={stats.checkedOutAssets}
            max={stats.totalAssets}
            color="bg-indigo-500"
          />
          <ProgressBar
            label="Available"
            value={stats.availableAssets}
            max={stats.totalAssets}
            color="bg-emerald-500"
          />
          <ProgressBar
            label="Overdue (Active Loans)"
            value={stats.overdueCount}
            max={stats.activeLoans || 1}
            color="bg-rose-500"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            Outstanding Fines
          </h3>
          {penalties.length === 0 ? (
            <p className="text-slate-500 text-sm">No unpaid fines on record.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500 uppercase text-xs tracking-wider">
                    <th className="pb-3 pr-3">Record ID</th>
                    <th className="pb-3 pr-3">Student ID</th>
                    <th className="pb-3 pr-3">Fine</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map((fine) => (
                    <tr key={fine.id} className="border-b border-slate-800/50 text-slate-300">
                      <td className="py-2.5 pr-3 font-mono text-xs">{fine.id}</td>
                      <td className="py-2.5 pr-3 font-mono">{fine.memberId}</td>
                      <td className="py-2.5 pr-3 text-amber-400 font-bold">
                        {fine.penaltyAccumulated} units
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-rose-950/50 text-rose-400 border border-rose-800/60 uppercase">
                          {fine.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
