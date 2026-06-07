import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { api } from "../api";

export default function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    usn: "",
    password: "",
  });

  const updateField = (field) => (e) => {
    const value = field === "usn" ? e.target.value.toUpperCase() : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email: form.email.trim(), password: form.password }
        : {
            name: form.name.trim(),
            email: form.email.trim(),
            usn: form.usn.trim(),
            password: form.password,
          };

    api
      .post(endpoint, payload)
      .then((response) => onAuthSuccess(response.data.user))
      .catch((err) => {
        setError(err.response?.data?.message || "Something went wrong. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Smart College Library
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {mode === "login" ? "Sign in with your student account" : "Create a new student account"}
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === "register"
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={updateField("name")}
                  placeholder="Your name"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  USN
                </label>
                <input
                  type="text"
                  value={form.usn}
                  onChange={updateField("usn")}
                  placeholder="e.g. 1CD23CS010"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@student.edu"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={updateField("password")}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {mode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                {loading ? "Signing in..." : "Sign In"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {loading ? "Creating account..." : "Create Account"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
