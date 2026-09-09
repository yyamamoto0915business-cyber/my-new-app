import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerMobileNav from "@/components/organizer/OrganizerMobileNav";
import { OrganizerMainChrome } from "@/components/organizer/OrganizerMainChrome";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";
import { OrganizerProSyncer } from "@/components/organizer/OrganizerProSyncer";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";
import { getDeveloperAdminContext } from "@/lib/admin-auth";
import { isPaidOrganizerWithPlanState } from "@/lib/billing";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, organizerRegistered, organizerId } = await getOrganizerNavState();
  const navVariant = organizerRegistered ? "full" : "lite";
  const admin = await getDeveloperAdminContext();
  const showAdminLink = Boolean(admin);

  let isPro = false;

  if (organizerRegistered && supabase && user && organizerId) {
    const [{ data }, { data: planState }] = await Promise.all([
      supabase
        .from("organizers")
        .select(
          "subscription_status, stripe_status, manual_grant_active, manual_grant_expires_at"
        )
        .eq("id", organizerId)
        .maybeSingle(),
      supabase
        .from("organizer_plan_state")
        .select("stripe_status, manual_grant_active, manual_grant_expires_at")
        .eq("organizer_id", organizerId)
        .maybeSingle(),
    ]);
    isPro = isPaidOrganizerWithPlanState(data ?? {}, planState);
  }

  return (
    <div className="org-workspace-shell flex min-h-0 flex-col bg-[#f9f9f7] [--mg-organizer-subheader-h:44px] min-[900px]:mt-[var(--mg-pc-top-nav-h)] min-[900px]:min-h-[calc(100dvh-var(--mg-pc-top-nav-h))]">
      <OrganizerProSyncer isPro={isPro} />
      {/* モバイルサブヘッダー（モードタブの下に sticky） */}
      <header className="org-workspace-mobile-bar sticky top-[calc(var(--mg-mobile-top-header-h,46px)+env(safe-area-inset-top,0px))] z-30 min-[900px]:hidden border-b border-[#e8e6e0] bg-white">
        <div className="flex items-stretch">
          <div className="min-w-0 flex-1">
            <OrganizerMobileNav variant={navVariant} />
          </div>
          {showAdminLink ? (
            <div className="flex shrink-0 items-center pr-1.5">
              <OrganizerAccountMenu />
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 min-[900px]:overflow-hidden">
        <OrganizerSidebar variant={navVariant} showAdminLink={showAdminLink} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:overflow-y-auto">
          <OrganizerMainChrome variant={navVariant}>
            <main className="relative z-[1] flex min-h-0 flex-1 flex-col px-4 py-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-3 sm:pb-4 min-[900px]:px-6 min-[900px]:py-2.5 min-[900px]:pb-2.5">
              {children}
            </main>
          </OrganizerMainChrome>
        </div>
      </div>
    </div>
  );
}
