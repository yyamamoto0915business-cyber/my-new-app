import { createAdminClient } from "@/lib/supabase/admin";
import { getJstTodayYmd } from "@/lib/jst-date";

/** サーバー側で受付状態を確認。参加者数は公開クライアントのRLSに依存させない。 */
export async function getRegistrationError(event: {
  id: string;
  date: string;
  endTime?: string | null;
  registrationDeadline?: string | null;
  capacity?: number | null;
}, now = new Date()): Promise<string | null> {
  if (event.date < getJstTodayYmd(now) ||
      (event.endTime && now >= new Date(`${event.date}T${event.endTime}+09:00`))) {
    return "このイベントは終了しています";
  }
  if (event.registrationDeadline && now > new Date(event.registrationDeadline)) {
    return "参加受付は終了しました";
  }
  if (event.capacity != null) {
    if (event.capacity <= 0) return "定員に達しています";
    const admin = createAdminClient();
    if (!admin) throw new Error("参加者数を確認できません");
    const { count, error } = await admin.from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .neq("status", "declined");
    if (error || count == null) throw error ?? new Error("参加者数を確認できません");
    if (count >= event.capacity) return "定員に達しています";
  }
  return null;
}
