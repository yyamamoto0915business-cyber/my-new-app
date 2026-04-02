import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerMobileNav from "@/components/organizer/OrganizerMobileNav";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const organizerRegistered = await (async () => {
    if (!supabase) return false;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    return !!data;
  })();

  const navVariant = organizerRegistered ? "full" : "lite";

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-[calc(var(--mg-mobile-top-header-h)+env(safe-area-inset-top,0px))] z-30 bg-white/85 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sm:top-0">
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-4 pb-3 sm:max-w-6xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <OrganizerMobileNav variant={navVariant} />
              <div className="min-w-0">
                <div className="truncate text-[18px] font-bold tracking-[-0.02em] text-slate-900 sm:text-lg">
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
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <OrganizerSidebar variant={navVariant} />

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
