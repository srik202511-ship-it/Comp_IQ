export const SERIES_COLORS = ["#3B82F6", "#06B6D4", "#F59E0B", "#6366F1", "#EF4444", "#10B981", "#EC4899"];

export function Card({ children, className = "", id, testid }) {
  return (
    <div
      id={id}
      data-testid={testid}
      className={`bg-[#111827] border border-[#1f2937] rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div>
        {eyebrow && (
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-400 mb-1.5">{eyebrow}</div>
        )}
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-50 tracking-tight">{title}</h1>
        <p className="text-slate-400 mt-1.5 text-sm sm:text-base max-w-2xl">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}
