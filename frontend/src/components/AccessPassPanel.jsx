import { useState } from "react";
import { QrCode, ShieldAlert, CheckCircle } from "lucide-react";
import { api } from "../api";

export default function AccessPassPanel() {
  const [memberId, setMemberId] = useState("");
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGeneratePass = () => {
    setLoading(true);
    setPassData(null);
    setErrorMessage("");

    api
      .get(`/api/generate_pass/${memberId.trim()}`)
      .then((response) => setPassData(response.data))
      .catch((error) => {
        setErrorMessage(
          error.response?.data?.message || "Unable to reach the access pass service."
        );
        console.error("Pass generation error:", error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl h-fit">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
        <QrCode className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold tracking-wide">Digital Access Pass</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Member Identifier
          </label>
          <input
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value.toUpperCase())}
            placeholder="Enter member ID"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-indigo-500 transition-colors font-mono tracking-wider"
          />
        </div>

        <button
          onClick={handleGeneratePass}
          disabled={loading || !memberId.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none tracking-wide uppercase text-sm"
        >
          {loading ? "Validating Account..." : "Request Access Pass"}
        </button>

        <div className="mt-6 pt-6 border-t border-slate-800">
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 flex gap-3 text-rose-300 text-sm shadow-inner">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <p>{errorMessage}</p>
            </div>
          )}

          {passData?.status === "SUCCESS" && (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 flex gap-3 text-emerald-300 text-sm text-left shadow-inner">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <p>{passData.message}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border border-slate-800 mx-auto transform hover:scale-105 transition-transform duration-200">
                <img
                  src={passData.qr_code}
                  alt="Digital access pass QR code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                Present at secure exit terminal for verification
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
