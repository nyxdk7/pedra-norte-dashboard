import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

type PainelLayoutProps = {
  children: React.ReactNode;
};

export default function PainelLayout({ children }: PainelLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AppSidebar />

      <main className="min-h-screen pb-20 lg:ml-72 lg:pb-0">
        {children}
      </main>

      <AppMobileNav />
    </div>
  );
}