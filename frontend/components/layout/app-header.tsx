import { RefreshCw } from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle: string;
  section?: string;
};

export function AppHeader({ title, subtitle, section }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-[-0.03em] text-slate-950">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Administrador
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {section || title}
            </p>
          </div>

          <button
            type="button"
            className="flex h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={17} />
            Sincronizar
          </button>
        </div>
      </div>
    </header>
  );
}