import type { ReactNode } from "react";

/** Shared field styles for the product add/edit form. */
export const productFieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export const productLabelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600";

export const productHintClass = "mt-1.5 text-xs leading-relaxed text-slate-500";

export function ProductFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-4 ${className ?? ""}`}
    >
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">{title}</h3>
      {description ? (
        <p className="-mt-2 mb-3 text-xs text-slate-500">{description}</p>
      ) : null}
      {children}
    </section>
  );
}
