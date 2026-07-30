type AppHeaderProps = {
  title: string;
  subtitle: string;
  section?: string;
};

export function AppHeader({ title, subtitle, section }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6 lg:px-7">
      <div className="flex min-h-[54px] flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-black tracking-[-0.035em] text-slate-950">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Administrador
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {section || title}
          </p>
        </div>
      </div>
    </header>
  );
}
