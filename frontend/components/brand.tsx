import { BarChart3 } from "lucide-react";

type BrandProps = {
  compact?: boolean;
  dark?: boolean;
};

export function Brand({ compact = false, dark = false }: BrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
          dark
            ? "bg-white/10 text-blue-200"
            : "bg-blue-50 text-blue-700"
        }`}
      >
        <BarChart3 size={19} strokeWidth={1.8} />
      </div>

      {!compact && (
        <div className="min-w-0">
          <h1
            className={`truncate text-[14px] font-semibold leading-5 ${
              dark ? "text-white" : "text-slate-900"
            }`}
          >
            MSM Industrial
          </h1>
          <p
            className={`truncate text-[12px] leading-4 ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Gestão de medições
          </p>
        </div>
      )}
    </div>
  );
}
