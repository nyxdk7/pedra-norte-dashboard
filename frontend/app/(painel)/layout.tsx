import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

type PainelLayoutProps = {
  children: React.ReactNode;
};

export default function PainelLayout({ children }: PainelLayoutProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <div className="min-h-screen bg-slate-100">
          <AppSidebar />

          <main className="min-h-screen pb-20 lg:ml-72 lg:pb-0">
            {children}
          </main>

          <AppMobileNav />
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}