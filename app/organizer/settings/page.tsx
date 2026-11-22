"use client";

import { getOrganizerAccess } from "@/lib/organizer/team";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { getPlanLabel, getSlotsLabel, getReceivingStatus } from "@/lib/organizer-billing-display";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";
import { OrganizerSettingsMobileView } from "@/components/organizer/settings/OrganizerSettingsMobileView";

// ── main page ──────────────────────────────────────────────────────────

export default function OrganizerSettingsPage() {
  const { user } = useSupabaseUser();

  const [organizer, setOrganizer] = useState<{
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);


  const [billing, setBilling] = useState<OrganizerBillingData | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user?.id) { setOrgLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const access = await getOrganizerAccess(supabase, user.id);
        const { data } = access
          ? await supabase
              .from("organizers")
              .select("organization_name, contact_email, contact_phone")
              .eq("id", access.organizerId)
              .maybeSingle()
          : { data: null };
        if (!cancelled) setOrganizer(data ?? null);
      } catch {
        if (!cancelled) setOrganizer(null);
      } finally {
        if (!cancelled) setOrgLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing");
        const json = await res.json();
        if (res.ok && !cancelled) setBilling(json);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayEmail = user?.email ?? "—";
  const displayName =
    (user?.user_metadata?.display_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "—";

  const planLabel = billing ? getPlanLabel(billing) : "—";
  const slots = billing ? getSlotsLabel(billing) : "—";
  const receiving = billing ? getReceivingStatus(billing) : null;

  const contactVal = organizer
    ? ([organizer.contact_email, organizer.contact_phone].filter(Boolean).join(" / ") || "未設定")
    : "—";

  return (
    <OrganizerPageShell variant="hero" contentClassName="space-y-1.5 pb-16 min-[900px]:space-y-2.5 min-[900px]:pb-0">
      {/* スマホ・PC 共通：見本「05_マイページ」の形（PC は中央にまとめる） */}
      <OrganizerSettingsMobileView
        planLabel={planLabel}
        slots={slots}
        receiving={receiving}
        displayEmail={displayEmail}
        displayName={displayName}
        organizationName={organizer?.organization_name ?? ""}
        contactVal={contactVal}
        orgLoading={orgLoading}
        billingLoading={billingLoading}
      />

    </OrganizerPageShell>
  );
}
