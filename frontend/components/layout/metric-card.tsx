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
    <article className="min-w-0 border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p
            title={value}
            className="mt-4 max-w-full break-words text-2xl font-bold leading-tight tracking-[-0.04em] text-slate-950 xl:text-[26px]"
          >
            {value}
          </p>

          <p className="mt-3 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <Icon
          size={25}
          strokeWidth={2}
          className="mt-1 shrink-0 text-[#111827]"
        />
      </div>
    </article>
  );
}