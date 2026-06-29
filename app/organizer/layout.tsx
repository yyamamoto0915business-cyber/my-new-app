import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerMobileNav from "@/components/organizer/OrganizerMobileNav";
import { OrganizerMainChrome } from "@/components/organizer/OrganizerMainChrome";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";
import { OrganizerProSyncer } from "@/components/organizer/OrganizerProSyncer";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";
import { getDeveloperAdminContext } from "@/lib/admin-auth";
import { isPaidOrganizer } from "@/lib/billing";

function MachiGlyphAvatarLogo({ isPro }: { isPro: boolean }) {
  const bg = isPro ? "#0A0D18" : "#2B3A6B";
  const dot = isPro ? "#f0d060" : "#6BBF3E";
  const lines = isPro
    ? ["#f0d060", "#f0d060", "#f0d060", "#C0C8D8", "#C0C8D8", "#C0C8D8"]
    : ["#6BBF3E", "#6BBF3E", "#6BBF3E", "#fff", "#fff", "#fff"];
  const nodes = isPro
    ? ["#f5e07a", "#f5e07a", "#f5e07a", "#E8EEFF", "#E8EEFF", "#E8EEFF"]
    : ["#6BBF3E", "#6BBF3E", "#6BBF3E", "#fff", "#fff", "#fff"];
  const center = isPro ? "#C0C8D8" : "#fff";
  const hex = isPro ? "rgba(200,168,75,0.35)" : "rgba(255,255,255,0.3)";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ background: bg }}
    >
      <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden>
        <polygon points="50,5 88,27 88,73 50,95 12,73 12,27" fill="none" stroke={hex} strokeWidth="3"/>
        <line x1="50" y1="5"  x2="50" y2="50" stroke={lines[0]} strokeWidth="6" strokeLinecap="round"/>
        <line x1="12" y1="73" x2="50" y2="50" stroke={lines[1]} strokeWidth="6" strokeLinecap="round"/>
        <line x1="88" y1="73" x2="50" y2="50" stroke={lines[2]} strokeWidth="6" strokeLinecap="round"/>
        <line x1="12" y1="27" x2="50" y2="50" stroke={lines[3]} strokeWidth="6" strokeLinecap="round"/>
        <line x1="88" y1="27" x2="50" y2="50" stroke={lines[4]} strokeWidth="6" strokeLinecap="round"/>
        <line x1="50" y1="95" x2="50" y2="50" stroke={lines[5]} strokeWidth="6" strokeLinecap="round"/>
        <circle cx="50" cy="5"  r="8" fill={nodes[0]} stroke={hex} strokeWidth="2"/>
        <circle cx="12" cy="73" r="8" fill={nodes[1]} stroke={hex} strokeWidth="2"/>
        <circle cx="88" cy="73" r="8" fill={nodes[2]} stroke={hex} strokeWidth="2"/>
        <circle cx="12" cy="27" r="8" fill={nodes[3]} stroke={hex} strokeWidth="2"/>
        <circle cx="88" cy="27" r="8" fill={nodes[4]} stroke={hex} strokeWidth="2"/>
        <circle cx="50" cy="95" r="8" fill={nodes[5]} stroke={hex} strokeWidth="2"/>
        <circle cx="50" cy="50" r="12" fill={center}/>
        <circle cx="50" cy="50" r="6"  fill={dot} opacity="0.85"/>
        <circle cx="50" cy="50" r="2.5" fill={dot}/>
      </svg>
    </div>
  );
}

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, organizerRegistered } = await getOrganizerNavState();
  const navVariant = organizerRegistered ? "full" : "lite";
  const admin = await getDeveloperAdminContext();
  const showAdminLink = Boolean(admin);

  let organizerName: string | undefined;
  let isPro = false;

  if (organizerRegistered && supabase && user) {
    const { data } = await supabase
      .from("organizers")
      .select("organization_name, subscription_status, stripe_status, manual_grant_active, manual_grant_expires_at")
      .eq("profile_id", user.id)
      .maybeSingle();
    organizerName = data?.organization_name ?? undefined;
    isPro = isPaidOrganizer(data ?? {});
  }

  return (
    <div className="org-workspace-shell flex min-h-0 flex-col bg-[#f9f9f7] [--mg-organizer-subheader-h:48px] min-[900px]:mt-[var(--mg-pc-top-nav-h)] min-[900px]:min-h-[calc(100dvh-var(--mg-pc-top-nav-h))]">
      <OrganizerProSyncer isPro={isPro} />
      {/* モバイルサブヘッダー（main top headerの下に sticky） */}
      <header className="sticky top-[calc(var(--mg-mobile-top-header-h,46px)+env(safe-area-inset-top,0px))] z-30 min-[900px]:hidden border-b border-[#e8e6e0] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
        <div className="mx-auto w-full max-w-screen-sm px-4 py-1.5">
          <div className="flex items-center gap-2">
            <OrganizerMobileNav
              variant={navVariant}
              isPro={isPro}
              organizerName={organizerName}
            />
            <MachiGlyphAvatarLogo isPro={isPro} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium" style={{ color: "#1a1a1a" }}>
                {organizerName ?? "主催者"}
              </p>
              <p className="text-[10px]" style={{ color: "#999" }}>主催者アカウント</p>
            </div>
            {showAdminLink && (
              <div className="shrink-0">
                <OrganizerAccountMenu />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 min-[900px]:overflow-hidden">
        <OrganizerSidebar variant={navVariant} showAdminLink={showAdminLink} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col min-[900px]:overflow-y-auto">
          <OrganizerMainChrome variant={navVariant}>
            <main className="relative z-[1] flex min-h-0 flex-1 flex-col px-4 py-2 pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-3 sm:pb-4 min-[900px]:px-6 min-[900px]:py-3 min-[900px]:pb-4">
              {children}
            </main>
          </OrganizerMainChrome>
        </div>
      </div>
    </div>
  );
}
