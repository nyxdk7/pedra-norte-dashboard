import { BarChart3 } from "lucide-react";

type BrandProps = {
  compact?: boolean;
  dark?: boolean;
};

export function Brand({ compact = false, dark = false }: BrandProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center",
          dark ? "text-white" : "text-[#111827]",
        ].join(" ")}
      >
        <BarChart3 size={25} strokeWidth={2} />
      </div>

      {!compact && (
        <div className="min-w-0">
          <h1
            className={[
              "truncate text-base font-bold leading-tight",
              dark ? "text-white" : "text-slate-950",
            ].join(" ")}
          >
            Pedra Norte
          </h1>
          <p
            className={[
              "truncate text-sm leading-tight",
              dark ? "text-slate-400" : "text-slate-500",
            ].join(" ")}
          >
            Dashboard de obras
          </p>
        </div>
      )}
    </div>
  );
}