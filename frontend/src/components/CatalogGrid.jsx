import { useState } from "react";
import { BookOpen } from "lucide-react";
import { api } from "../api";

export default function CatalogGrid({ assets, user, onBorrowSuccess }) {
  const [borrowingIsbn, setBorrowingIsbn] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleBorrow = (book) => {
    const isbn = book.isbn || book.id;
    if (!user?.usn) {
      setError("Please sign in to borrow books.");
      return;
    }

    setBorrowingIsbn(isbn);
    setMessage("");
    setError("");

    api
      .post("/api/books/borrow", { studentId: user.usn, isbn })
      .then((response) => {
        setMessage(response.data.message);
        onBorrowSuccess?.();
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not borrow book.");
      })
      .finally(() => setBorrowingIsbn(null));
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold tracking-wide">Book Catalog</h2>
      </div>

      {message && (
        <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-xl px-4 py-3 mb-4">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl px-4 py-3 mb-4">
          {error}
        </p>
      )}

      {assets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
          No books found. Check that the backend is running and Firestore is connected.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset) => {
            const isbn = asset.isbn || asset.id;
            const isBorrowing = borrowingIsbn === isbn;

            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-xl"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="font-bold text-lg text-slate-100 line-clamp-1">
                    {asset.title || "Untitled Book"}
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
                <p className="text-slate-500 text-xs mb-3">
                  <span className="text-slate-600 font-medium">ISBN:</span> {asset.isbn || "N/A"}
                </p>

                {asset.isAvailable && user && (
                  <button
                    onClick={() => handleBorrow(asset)}
                    disabled={isBorrowing}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isBorrowing ? "Borrowing..." : "Borrow"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
