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
    <article className="min-w-0 border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p
            title={value}
            className="mt-4 max-w-full break-words text-[clamp(1.45rem,2vw,2rem)] font-black leading-[1.08] tracking-[-0.045em] text-slate-950"
          >
            {value}
          </p>

          <p className="mt-4 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-slate-950 text-white">
          <Icon size={23} strokeWidth={2} />
        </div>
      </div>
    </article>
  );
}
