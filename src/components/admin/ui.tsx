import { cn } from "@/lib/utils";

export const inputCls =
  "block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-ink shadow-xs placeholder:text-stone-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:bg-stone-50";

export const buttonCls = {
  primary: "inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-60",
  secondary: "inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60",
  danger: "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60",
  ghost: "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100",
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string[] | string;
  children: React.ReactNode;
  className?: string;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-800">
        {label}
      </label>
      {children}
      {hint && !err && <p className="text-xs text-stone-500">{hint}</p>}
      {err && <p className="text-xs font-semibold text-red-700">{err}</p>}
    </div>
  );
}

export function Card({ children, className, title, actions }: { children: React.ReactNode; className?: string; title?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-stone-200 bg-white shadow-xs", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3">
          {title && <h2 className="font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "stone" }: { children: React.ReactNode; tone?: "stone" | "green" | "red" | "amber" }) {
  const tones = {
    stone: "bg-stone-100 text-stone-700",
    green: "bg-green-50 text-green-700 ring-green-200",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-800",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold", tones[tone])}>{children}</span>;
}
