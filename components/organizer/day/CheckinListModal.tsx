"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Modal } from "./day-management-shared";

type CheckinRecord = {
  id: string;
  name: string;
  checkedInAt: string;
  type: "login" | "guest";
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
  } catch {
    return iso;
  }
}

export function CheckinListModal({ open, onClose, eventId, eventTitle }: Props) {
  const [list, setList] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!eventId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/checkin`);
      if (res.ok) {
        const data = await res.json();
        setList(data.list ?? []);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (open && eventId) void load();
  }, [open, eventId, load]);

  useEffect(() => {
    if (!open || !eventId) return;
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, 10_000);
    return () => window.clearInterval(id);
  }, [open, eventId, load]);

  const handleCsv = () => {
    const rows = [
      ["名前", "受付時間", "種別"],
      ...list.map((r) => [
        r.name,
        new Date(r.checkedInAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
        r.type === "login" ? "ログイン" : "ゲスト",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `checkin-${eventId}.csv`;
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} title="受付リスト">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12px] text-[#566358]">
          {eventTitle} — {list.length}人受付済み
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} className="flex items-center gap-1 text-[11px] text-[#566358]">
            <RefreshCw size={11} />
            更新
          </button>
          {list.length > 0 && (
            <button
              type="button"
              onClick={handleCsv}
              className="flex items-center gap-1 rounded-lg bg-[#F5F8F5] px-2.5 py-1 text-[11px] font-medium text-[#2D7A4F] border border-[#DDE8DF]"
            >
              <Download size={11} />
              CSV出力
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D7A4F] border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl bg-[#F5F8F5] py-8 text-center">
          <p className="text-[13px] text-[#566358]">まだ受付はありません</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-[#DDE8DF]">
                <th className="pb-2 text-[11px] font-semibold text-[#566358]">名前</th>
                <th className="pb-2 text-[11px] font-semibold text-[#566358]">受付時間</th>
                <th className="pb-2 text-[11px] font-semibold text-[#566358]">種別</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-[#F5F8F5]">
                  <td className="py-2 text-[12px] font-medium text-[#1A2214]">{r.name}</td>
                  <td className="py-2 text-[12px] text-[#566358]">{formatTime(r.checkedInAt)}</td>
                  <td className="py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.type === "login"
                          ? "bg-[#EAF4ED] text-[#2D7A4F]"
                          : "bg-[#F5F8F5] text-[#566358]"
                      }`}
                    >
                      {r.type === "login" ? "ログイン" : "ゲスト"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
