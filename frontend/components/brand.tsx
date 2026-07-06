import { BarChart3 } from "lucide-react";

type BrandProps = {
  compact?: boolean;
  dark?: boolean;
};

export function Brand({ compact = false, dark = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-11 w-11 items-center justify-center border text-sm font-bold shadow-sm",
          dark
            ? "border-slate-700 bg-slate-950 text-white"
            : "border-slate-300 bg-white text-slate-950",
        ].join(" ")}
      >
        <BarChart3 size={22} strokeWidth={2} />
      </div>

      {!compact && (
        <div>
          <h1
            className={[
              "text-base font-bold leading-tight",
              dark ? "text-white" : "text-slate-950",
            ].join(" ")}
          >
            Pedra Norte
          </h1>
          <p
            className={[
              "text-sm leading-tight",
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