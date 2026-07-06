import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article className="border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
          <p className="mt-3 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-slate-950 text-white">
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}