import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerMobileNav from "@/components/organizer/OrganizerMobileNav";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";
import { SiteFooter } from "@/components/site-footer";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <OrganizerMobileNav />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-slate-800 sm:text-lg">
                主催者管理
              </div>
              <div className="hidden truncate text-xs text-slate-500 sm:block">
                イベントの作成・編集・管理ができます
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <OrganizerAccountMenu />
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <OrganizerSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
