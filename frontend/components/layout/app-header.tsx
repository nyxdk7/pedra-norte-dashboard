type AppHeaderProps = {
  title: string;
  subtitle: string;
  section?: string;
};

export function AppHeader({ title, subtitle, section }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 lg:px-7">
      <div className="flex min-h-12 items-center justify-between gap-6">
        <div className="min-w-0">
          <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-slate-900 sm:text-[21px]">
            {title}
          </h1>
          <p className="mt-0.5 max-w-3xl truncate text-[13px] text-slate-500 sm:text-sm">
            {subtitle}
          </p>
        </div>

        {section && (
          <div className="hidden shrink-0 items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>{section}</span>
          </div>
        )}
      </div>
    </header>
  );
}
