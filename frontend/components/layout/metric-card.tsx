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
    <article
      tabIndex={0}
      aria-label={`${label}: ${value}`}
      className="metric-card group relative min-w-0 rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none"
    >
      <div className="relative z-[1] flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>

          <p
            title={value}
            className="font-numeric mt-2 truncate text-[clamp(1.18rem,1.45vw,1.55rem)] font-semibold leading-tight tracking-[-0.02em] text-slate-900"
          >
            {value}
          </p>

          <p
            className="mt-2 truncate text-[12px] text-slate-500"
            title={description}
          >
            {description}
          </p>
        </div>

        <div className="metric-card-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>

      <div className="metric-value-popover" aria-hidden="true">
        <span className="metric-value-popover-label">Valor completo</span>
        <strong className="font-numeric metric-value-popover-number">
          {value}
        </strong>
      </div>
    </article>
  );
}
