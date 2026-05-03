import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerMobileNav from "@/components/organizer/OrganizerMobileNav";
import { OrganizerStickyHeaderTitle } from "@/components/organizer/OrganizerStickyHeaderTitle";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";
import { getDeveloperAdminContext } from "@/lib/admin-auth";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizerRegistered } = await getOrganizerNavState();
  const navVariant = organizerRegistered ? "full" : "lite";
  const admin = await getDeveloperAdminContext();
  const showAdminLink = Boolean(admin);

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <header className="sticky top-[calc(var(--mg-mobile-top-header-h)+env(safe-area-inset-top,0px))] z-30 border-b border-slate-200/60 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:top-0 sm:border-b-0 min-[900px]:hidden">
        <div className="mx-auto w-full max-w-screen-sm px-4 pt-2 pb-1.5 sm:max-w-6xl sm:px-6 sm:pt-4 sm:pb-3 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <OrganizerMobileNav variant={navVariant} />
              <OrganizerStickyHeaderTitle />
            </div>

            <div className="shrink-0">
              <OrganizerAccountMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        <OrganizerSidebar variant={navVariant} showAdminLink={showAdminLink} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-5 py-5 sm:px-6 sm:py-6 min-[900px]:px-8 min-[900px]:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
