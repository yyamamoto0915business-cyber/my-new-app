import { Suspense } from "react";
import { DayManagementHub } from "@/components/organizer/day/DayManagementHub";
import { OrganizerRegisterChoice } from "@/components/organizer/OrganizerRegisterChoice";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";
import { fetchDayManageableEvents } from "@/lib/organizer/day-manageable-events";

export default async function OrganizerPage() {
  const { supabase, organizerRegistered, organizerId } = await getOrganizerNavState();
  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-5 py-5 text-sm text-amber-900">
        <p className="font-medium">データベースに接続できません。</p>
        <p className="mt-1 text-xs text-amber-800">
          しばらく時間をおいてから再度お試しください。
        </p>
      </div>
    );
  }

  if (organizerRegistered && organizerId) {
    const initialEvents = await fetchDayManageableEvents(supabase, organizerId).catch(() => []);
    return (
      <Suspense fallback={<div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">読み込み中...</div>}>
        <DayManagementHub initialEvents={initialEvents} />
      </Suspense>
    );
  }

  return <OrganizerRegisterChoice />;
}
