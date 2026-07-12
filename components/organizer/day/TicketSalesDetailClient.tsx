"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  formatCheckedInRatio,
  formatSoldTickets,
  formatYen,
} from "@/lib/organizer/day-ops-format";
import type { DayOpsTicketSalesSummary } from "@/lib/organizer/day-ops-types";

type ReportResponse = {
  event: {
    id: string;
    title: string;
    date: string;
    price: number;
    capacity: number | null;
  };
  summary: DayOpsTicketSalesSummary;
  orders: Array<{
    id: string;
    amount: number;
    status: "paid" | "refunded";
    createdAt: string;
    buyerName: string;
  }>;
};

function formatOrderTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TicketSalesDetailClient() {
  const params = useParams();
  const eventId = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`/api/organizer/events/${eventId}/ticket-sales`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "取得に失敗しました");
      }
      setData(body as ReportResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const backHref = eventId ? `/organizer?event=${encodeURIComponent(eventId)}` : "/organizer";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft size={14} />
        ダッシュボードに戻る
      </Link>

      <header className="mt-4">
        <h1 className="text-[20px] font-bold text-[#1A2214]">チケット販売レポート</h1>
        {data ? (
          <p className="mt-1 text-[13px] text-[#566358]">
            {data.event.title}
            {data.event.date ? ` · ${data.event.date}` : ""}
          </p>
        ) : null}
      </header>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#EAF4ED]" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[13px] text-[#566358]">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[#2D7A4F] px-3 py-1.5 text-[12px] font-medium text-[#2D7A4F]"
          >
            <RefreshCw size={12} />
            再読み込み
          </button>
        </div>
      ) : !data ? (
        <div className="mt-6 rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[13px] text-[#566358]">データを表示できません</p>
        </div>
      ) : data.summary.salesMode === "free" ? (
        <div className="mt-6 rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[13px] text-[#566358]">無料イベントのため、販売レポートはありません。</p>
        </div>
      ) : data.summary.salesMode === "offline" ? (
        <div className="mt-6 rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[13px] text-[#566358]">
            このイベントではオンラインチケット販売を利用していません
          </p>
        </div>
      ) : (
        <TicketSalesReportBody data={data} onRefresh={() => void load()} />
      )}
    </div>
  );
}

function TicketSalesReportBody({
  data,
  onRefresh,
}: {
  data: ReportResponse;
  onRefresh: () => void;
}) {
  const sales = data.summary.sales;
  const attendance = data.summary.attendance;

  return (
    <>
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="販売枚数"
          value={sales ? formatSoldTickets(sales.soldTickets, sales.capacity) : "—"}
        />
        <Metric label="注文数" value={sales ? `${sales.orderCount}件` : "—"} />
        <Metric label="総売上" value={sales ? formatYen(sales.grossSalesYen) : "—"} />
        <Metric
          label="チェックイン"
          value={
            sales
              ? formatCheckedInRatio(sales.checkedIn, sales.validHolders || sales.soldTickets)
              : attendance
                ? `${attendance.checkedIn}人`
                : "—"
          }
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#DDE8DF] bg-white">
        <div className="flex items-center justify-between border-b border-[#EAF4ED] px-4 py-3">
          <h2 className="text-[14px] font-bold text-[#1A2214]">注文一覧</h2>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 text-[11px] text-[#566358]"
          >
            <RefreshCw size={11} />
            更新
          </button>
        </div>
        {data.orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#566358]">まだ注文がありません</p>
        ) : (
          <ul className="divide-y divide-[#EAF4ED]">
            {data.orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#1A2214]">{order.buyerName}</p>
                  <p className="mt-0.5 text-[11px] text-[#566358]">{formatOrderTime(order.createdAt)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-[#1A2214]">{formatYen(order.amount)}</p>
                  <p
                    className={
                      order.status === "refunded"
                        ? "text-[11px] font-medium text-[#E53935]"
                        : "text-[11px] font-medium text-[#2D7A4F]"
                    }
                  >
                    {order.status === "refunded" ? "返金済み" : "支払済み"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#DDE8DF] bg-white px-3 py-3">
      <p className="text-[11px] text-[#566358]">{label}</p>
      <p className="mt-1 text-[16px] font-bold text-[#1A2214]">{value}</p>
    </div>
  );
}
