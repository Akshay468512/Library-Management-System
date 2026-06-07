import { useEffect, useState } from "react";
import { BookMarked, RotateCcw } from "lucide-react";
import { api } from "../api";

export default function MyBorrowedBooks({ user, onReturnSuccess }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningIsbn, setReturningIsbn] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchBorrowed = () => {
    if (!user?.usn) return;

    setLoading(true);
    api
      .get("/api/books/my-borrowed", { params: { studentId: user.usn } })
      .then((response) => setBooks(response.data))
      .catch((err) => {
        console.error("Borrowed books error:", err);
        setBooks([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBorrowed();
  }, [user?.usn]);

  const handleReturn = (isbn) => {
    setReturningIsbn(isbn);
    setMessage("");
    setError("");

    api
      .post("/api/books/return", { studentId: user.usn, isbn })
      .then((response) => {
        setMessage(response.data.message);
        fetchBorrowed();
        onReturnSuccess?.();
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Could not return book.");
      })
      .finally(() => setReturningIsbn(null));
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <BookMarked className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold tracking-wide">My Borrowed Books</h2>
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

      {loading ? (
        <p className="text-slate-500 text-sm">Loading your books...</p>
      ) : books.length === 0 ? (
        <p className="text-slate-500 text-sm">You have no books checked out right now.</p>
      ) : (
        <div className="space-y-3">
          {books.map((book) => (
            <div
              key={book.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-slate-100">{book.title || "Unknown title"}</p>
                <p className="text-sm text-slate-400">{book.author || "Unknown author"}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">ISBN: {book.isbn}</p>
                {book.dueDate && (
                  <p className="text-xs text-amber-400/80 mt-1">
                    Due: {new Date(book.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleReturn(book.isbn)}
                disabled={returningIsbn === book.isbn}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                {returningIsbn === book.isbn ? "Returning..." : "Return Book"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
