import { useState } from "react";
import { ScanLine, ShieldCheck, ShieldX } from "lucide-react";
import { api } from "../api";

export default function GateScannerTerminal() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setResult(null);

    api
      .post("/api/verify_pass", { token: token.trim() })
      .then((response) => setResult(response.data))
      .catch((error) => {
        setResult({
          status: "ACCESS DENIED",
          message: error.response?.data?.message || "Verification service unreachable.",
        });
        console.error("Verification error:", error);
      })
      .finally(() => setLoading(false));
  };

  const isGranted = result?.status === "ACCESS GRANTED";

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <ScanLine className="w-6 h-6 text-cyan-400" />
        <div>
          <h2 className="text-xl font-bold tracking-wide">Gate Scanner</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan or paste a QR token to verify library exit pass
          </p>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            QR Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Scan or paste QR token..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="w-full bg-gradient-to-r from-cyan-700 to-teal-700 hover:from-cyan-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 uppercase text-sm tracking-wide"
        >
          {loading ? "Verifying..." : "Verify Pass"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 rounded-2xl border-2 p-6 text-center shadow-inner ${
            isGranted
              ? "bg-emerald-950/50 border-emerald-500/60"
              : "bg-rose-950/50 border-rose-500/60"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            {isGranted ? (
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            ) : (
              <ShieldX className="w-12 h-12 text-rose-400" />
            )}
            <p
              className={`text-2xl sm:text-3xl font-black tracking-widest ${
                isGranted ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {result.status}
            </p>
            <p className={`text-sm ${isGranted ? "text-emerald-300" : "text-rose-300"}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
