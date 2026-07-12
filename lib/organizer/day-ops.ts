import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DayOpsSalesMode,
  DayOpsTicketSalesSummary,
} from "@/lib/organizer/day-ops-types";

export { formatJstHm, formatLastUpdatedLabel, formatYen, formatSoldTickets, formatCheckedInRatio } from "@/lib/organizer/day-ops-format";

type EventRow = {
  id: string;
  price: number | null;
  capacity: number | null;
  participation_mode: string | null;
  requires_registration: boolean | null;
};

type OrderRow = {
  amount: number | null;
  status: string;
};

type ParticipantRow = {
  status: string;
};

function resolveSalesMode(
  price: number,
  participationMode: string,
  hasPaidOrRefundedOrders: boolean
): DayOpsSalesMode {
  if (price <= 0) return "free";
  // 申込必須の有料イベントはオンライン決済導線を利用
  if (participationMode === "required" || hasPaidOrRefundedOrders) return "stripe";
  return "offline";
}

/**
 * イベントのチケット販売・来場状況を集計する。
 * Stripe は触らず、Supabase 上の event_orders / participants / checkins のみ参照。
 */
export async function getTicketSalesAttendanceSummary(
  supabase: SupabaseClient,
  eventId: string
): Promise<DayOpsTicketSalesSummary | null> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, price, capacity, participation_mode, requires_registration")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) return null;

  const row = event as EventRow;
  const price = Number(row.price ?? 0);
  const capacity = row.capacity != null ? Number(row.capacity) : null;
  const participationMode =
    row.participation_mode ?? (row.requires_registration ? "required" : "none");

  const [ordersRes, participantsRes, checkinsRes] = await Promise.all([
    supabase.from("event_orders").select("amount, status").eq("event_id", eventId),
    supabase.from("event_participants").select("status").eq("event_id", eventId),
    supabase.from("event_checkins").select("id, user_id").eq("event_id", eventId),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const participants = (participantsRes.data ?? []) as ParticipantRow[];
  const checkinCount = checkinsRes.data?.length ?? 0;

  const paidOrders = orders.filter((o) => o.status === "paid");
  const refundedOrders = orders.filter((o) => o.status === "refunded");
  const soldOrders = [...paidOrders, ...refundedOrders];
  const hasPaidOrRefunded = soldOrders.length > 0;

  const salesMode = resolveSalesMode(price, participationMode, hasPaidOrRefunded);

  // 販売枚数・注文数は 1注文=1枚（現状の Checkout 仕様）
  const soldTickets = soldOrders.length;
  const orderCount = soldOrders.length;
  const grossSalesYen = soldOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const validHolders = paidOrders.length;

  const declined = participants.filter((p) => p.status === "declined").length;
  const activeParticipants = participants.filter(
    (p) => p.status !== "declined" && p.status !== "change_requested"
  ).length;
  const participantCheckedIn = participants.filter(
    (p) => p.status === "checked_in" || p.status === "completed"
  ).length;

  // チェックイン数は event_checkins を優先。無い場合は参加者ステータスをフォールバック
  const checkedIn = Math.max(checkinCount, participantCheckedIn);

  let notCheckedIn: number;
  let cancelled: number;

  if (salesMode === "stripe") {
    cancelled = refundedOrders.length + declined;
    notCheckedIn = Math.max(0, validHolders - checkedIn);
  } else {
    cancelled = declined + refundedOrders.length;
    const base = salesMode === "free" ? activeParticipants : Math.max(activeParticipants, validHolders);
    notCheckedIn = Math.max(0, base - checkedIn);
  }

  const purchased =
    salesMode === "stripe"
      ? orderCount
      : salesMode === "free"
        ? participants.length
        : Math.max(participants.length, orderCount);

  const attended = checkedIn;
  const receptionComplete = checkedIn;

  return {
    updatedAt: new Date().toISOString(),
    salesMode,
    attendance: {
      checkedIn,
      notCheckedIn,
      cancelled,
    },
    sales:
      salesMode === "stripe"
        ? {
            soldTickets,
            capacity,
            orderCount,
            grossSalesYen,
            checkedIn,
            validHolders,
          }
        : null,
    flow: {
      purchased,
      attended,
      receptionComplete,
    },
  };
}
