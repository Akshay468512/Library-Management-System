import { useEffect, useState } from "react";
import { ArrowRightLeft, RotateCcw, AlertTriangle, CheckCircle, X } from "lucide-react";
import { api } from "../api";

function FineModal({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${
          result.penaltyApplied
            ? "bg-amber-950/90 border-amber-600/60"
            : "bg-emerald-950/90 border-emerald-600/60"
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <CheckCircle
            className={`w-6 h-6 ${result.penaltyApplied ? "text-amber-400" : "text-emerald-400"}`}
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-100 mb-2">Check-In Complete</h3>
        <p className="text-sm text-slate-300 mb-4">{result.message}</p>

        {result.penaltyApplied ? (
          <div className="rounded-xl bg-slate-950/50 border border-amber-800/40 p-4 space-y-2 text-sm">
            <p className="text-amber-200">
              <span className="text-slate-500">Days overdue:</span> {result.daysOverdue}
            </p>
            <p className="text-amber-300 font-bold text-lg">
              Fine amount: {result.penaltyAccumulated} units
            </p>
            <p className="text-xs font-mono text-amber-400/70">
              Record ID: {result.fineId}
            </p>
          </div>
        ) : (
          <p className="text-emerald-300 text-sm">No late fines applied.</p>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function OperationsDesk({ onCatalogRefresh }) {
  const [memberId, setMemberId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  const [returnTxId, setReturnTxId] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinModal, setCheckinModal] = useState(null);
  const [checkinError, setCheckinError] = useState("");

  const [activeLoans, setActiveLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);

  const fetchActiveLoans = () => {
    setLoansLoading(true);
    api
      .get("/api/transactions?status=active")
      .then((response) => setActiveLoans(response.data))
      .catch((error) => console.error("Error fetching active loans:", error))
      .finally(() => setLoansLoading(false));
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleCheckout = (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutResult(null);
    setCheckoutError("");

    api
      .post("/api/transactions/issue", {
        memberId: memberId.trim(),
        assetId: assetId.trim(),
      })
      .then((response) => {
        setCheckoutResult(response.data);
        setMemberId("");
        setAssetId("");
        fetchActiveLoans();
        onCatalogRefresh?.();
      })
      .catch((error) => {
        setCheckoutError(error.response?.data?.message || "Check-out operation failed.");
        console.error("Check-out error:", error);
      })
      .finally(() => setCheckoutLoading(false));
  };

  const handleCheckin = (transactionId) => {
    const txId = transactionId || returnTxId.trim();
    if (!txId) return;

    setCheckinLoading(true);
    setCheckinModal(null);
    setCheckinError("");

    api
      .post("/api/transactions/return", { transactionId: txId })
      .then((response) => {
        setCheckinModal(response.data);
        setReturnTxId("");
        fetchActiveLoans();
        onCatalogRefresh?.();
      })
      .catch((error) => {
        setCheckinError(error.response?.data?.message || "Check-in operation failed.");
        console.error("Check-in error:", error);
      })
      .finally(() => setCheckinLoading(false));
  };

  return (
    <>
      <FineModal result={checkinModal} onClose={() => setCheckinModal(null)} />

      <div className="space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold">Issue Book</h3>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Student ID (USN)
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value.toUpperCase())}
                  placeholder="Enter USN or Student ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Book ID
                </label>
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="Paste book ID from catalog"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 uppercase text-sm tracking-wide"
              >
                {checkoutLoading ? "Processing..." : "Issue Book"}
              </button>
            </form>

            {checkoutError && (
              <div className="mt-4 bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 text-rose-300 text-sm flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {checkoutError}
              </div>
            )}
            {checkoutResult && (
              <div className="mt-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-3 text-emerald-300 text-sm flex gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>{checkoutResult.message}</p>
                  <p className="text-xs text-emerald-400/80 mt-1 font-mono">
                    Transaction ID: {checkoutResult.transactionId}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <RotateCcw className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Return Book</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Transaction ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={returnTxId}
                    onChange={(e) => setReturnTxId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleCheckin()}
                    disabled={checkinLoading || !returnTxId.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 rounded-xl transition-colors disabled:opacity-50 uppercase text-xs tracking-wide"
                  >
                    {checkinLoading ? "..." : "Check In"}
                  </button>
                </div>
              </div>

              {checkinError && (
                <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 text-rose-300 text-sm flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {checkinError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Active Loans</h3>
            <button
              onClick={fetchActiveLoans}
              className="text-xs text-slate-400 hover:text-white uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>

          {loansLoading ? (
            <p className="text-slate-500 text-sm">Loading active loans...</p>
          ) : activeLoans.length === 0 ? (
            <p className="text-slate-500 text-sm">No books currently checked out.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500 uppercase text-xs tracking-wider">
                    <th className="pb-3 pr-4">Transaction ID</th>
                    <th className="pb-3 pr-4">Student ID</th>
                    <th className="pb-3 pr-4">Book ID</th>
                    <th className="pb-3 pr-4">Due Date</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => (
                    <tr key={loan.id} className="border-b border-slate-800/50 text-slate-300">
                      <td className="py-3 pr-4 font-mono text-xs">{loan.id}</td>
                      <td className="py-3 pr-4 font-mono">{loan.memberId}</td>
                      <td className="py-3 pr-4 font-mono text-xs truncate max-w-[120px]">
                        {loan.assetId}
                      </td>
                      <td className="py-3 pr-4 text-xs">
                        {loan.dueTimestamp
                          ? new Date(loan.dueTimestamp).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleCheckin(loan.id)}
                          disabled={checkinLoading}
                          className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          Check In
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
