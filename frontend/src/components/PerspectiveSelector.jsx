const PERSPECTIVES = [
  { value: "member", label: "Member Console" },
  { value: "operations", label: "Operations Desk" },
  { value: "executive", label: "Executive Analytics" },
];

export default function PerspectiveSelector({ activePerspective, onPerspectiveChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        System Perspectives
      </span>
      <select
        value={activePerspective}
        onChange={(e) => onPerspectiveChange(e.target.value)}
        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer min-w-[220px]"
      >
        {PERSPECTIVES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
