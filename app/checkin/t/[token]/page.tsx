"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type EventInfo = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
};

type Phase = "loading" | "confirm" | "done" | "already" | "error";

export default function CheckinTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const { user, loading: userLoading } = useSupabaseUser();

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [duplicateGuest, setDuplicateGuest] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/checkin/t/${token}`);
        if (!res.ok) {
          setPhase("error");
          setErrorMsg("イベントが見つかりません");
          return;
        }
        const data = await res.json();
        setEvent(data);
        setPhase("confirm");
      } catch {
        setPhase("error");
        setErrorMsg("読み込みに失敗しました");
      }
    })();
  }, [token]);

  const handleCheckin = async (force = false) => {
    setSubmitting(true);
    setErrorMsg("");
    setDuplicateGuest(false);

    const body: Record<string, unknown> = {};
    if (!user) body.guest_name = guestName.trim();
    if (force) body.force = true;

    try {
      const res = await fetch(`/api/checkin/t/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.error === "duplicate_guest") {
        setDuplicateGuest(true);
        setSubmitting(false);
        return;
      }
      if (res.status === 409 && data.alreadyCheckedIn) {
        setPhase("already");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error ?? "チェックインに失敗しました");
        setSubmitting(false);
        return;
      }
      setPhase("done");
    } catch {
      setErrorMsg("通信エラーが発生しました");
      setSubmitting(false);
    }
  };

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "";

  if (phase === "loading" || userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#315c4b] border-t-transparent" />
          <p className="text-[13px] text-[#607083]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f8f5] px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-[#d8e3dc] max-w-sm w-full">
          <div className="mb-4 text-4xl">😕</div>
          <h1 className="text-lg font-bold text-[#172033]">QRコードが無効です</h1>
          <p className="mt-2 text-[13px] text-[#607083]">{errorMsg}</p>
          <Link href="/" className="mt-5 block rounded-xl bg-[#315c4b] py-3 text-[14px] font-bold text-white">
            ホームへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "already") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f8f5] px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-[#d8e3dc] max-w-sm w-full">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-lg font-bold text-[#172033]">すでにチェックイン済みです</h1>
          <p className="mt-2 text-[13px] text-[#607083]">{event?.title} への受付はすでに完了しています。</p>
          <Link href={`/events/${event?.id}`} className="mt-5 block rounded-xl bg-[#315c4b] py-3 text-[14px] font-bold text-white">
            イベント詳細を見る
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-[#f5f8f5] pb-24">
        <div className="relative overflow-hidden bg-[#315c4b] px-4 pb-10 pt-12">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url(/assets/machiglyph/checkin/backgrounds/machi_pattern_background.svg)",
              backgroundSize: "200px",
            }}
          />
          <div className="relative z-10 text-center">
            <Image
              src="/assets/machiglyph/checkin/icons/check_circle_icon.svg"
              width={56}
              height={56}
              alt=""
              className="mx-auto brightness-[10]"
            />
            <h1 className="mt-3 text-2xl font-bold text-white">チェックイン完了</h1>
            <p className="mt-1 text-[13px] text-white/80">受付が完了しました。</p>
          </div>
        </div>

        <div className="mx-auto max-w-sm px-4 -mt-4 space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#d8e3dc]">
            <p className="text-[12px] text-[#607083]">チェックインしたイベント</p>
            <p className="mt-1 text-[15px] font-bold text-[#172033]">{event?.title}</p>
            <p className="mt-1 text-[13px] text-[#315c4b] font-medium">
              イベントをお楽しみください！
            </p>
          </div>

          {event?.id && (
            <Link
              href={`/events/${event.id}`}
              className="block w-full rounded-xl bg-[#315c4b] py-3 text-center text-[14px] font-bold text-white"
            >
              イベント詳細を見る
            </Link>
          )}

          {!user && (
            <div className="rounded-2xl bg-[#eef6f0] p-4 border border-[#d8e3dc]">
              <p className="text-[12px] font-semibold text-[#315c4b]">
                次回から名前入力なしで参加できます
              </p>
              <p className="mt-1 text-[11px] text-[#607083]">
                アカウント登録すると参加履歴が保存されます。
              </p>
              <Link
                href="/auth"
                className="mt-3 block w-full rounded-xl bg-[#c28f13] py-2.5 text-center text-[13px] font-bold text-white"
              >
                無料で登録する
              </Link>
            </div>
          )}

          <Link href="/" className="block text-center text-[13px] text-[#607083] underline py-2">
            ホームへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8f5] pb-24">
      <div className="relative overflow-hidden bg-[#315c4b] px-4 pb-8 pt-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(/assets/machiglyph/checkin/backgrounds/machi_pattern_background.svg)",
            backgroundSize: "200px",
          }}
        />
        <div className="relative z-10 text-center">
          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white">
            受付確認
          </span>
          <h1 className="mt-3 text-xl font-bold text-white line-clamp-2 px-4">{event?.title}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-sm px-4 -mt-4 space-y-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#d8e3dc]">
          <p className="text-[12px] font-semibold text-[#607083] mb-3">イベント情報</p>
          {event?.date && (
            <div className="flex items-center gap-2 text-[13px] text-[#172033]">
              <span className="text-[#315c4b]">📅</span>
              <span>
                {event.date}
                {event.startTime ? ` ${event.startTime}〜${event.endTime ?? ""}` : ""}
              </span>
            </div>
          )}
          {event?.location && (
            <div className="flex items-center gap-2 text-[13px] text-[#172033] mt-1.5">
              <span className="text-[#315c4b]">📍</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#d8e3dc]">
          <p className="text-[12px] font-semibold text-[#607083] mb-2">
            {user ? "チェックインするアカウント" : "お名前を入力してください"}
          </p>

          {user ? (
            <div className="rounded-xl bg-[#eef6f0] px-4 py-3">
              <p className="text-[15px] font-bold text-[#172033]">{displayName}</p>
              <p className="text-[11px] text-[#607083]">{user.email}</p>
            </div>
          ) : (
            <input
              type="text"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setDuplicateGuest(false);
              }}
              placeholder="例：山田太郎"
              className="w-full rounded-xl border border-[#d8e3dc] bg-[#f5f8f5] px-4 py-3 text-[15px] text-[#172033] placeholder:text-[#607083]/50 focus:border-[#315c4b] focus:outline-none focus:ring-2 focus:ring-[#315c4b]/20"
            />
          )}

          {errorMsg && !duplicateGuest && (
            <p className="mt-2 text-[12px] text-red-600">{errorMsg}</p>
          )}

          {duplicateGuest && (
            <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <p className="text-[12px] text-orange-700 font-medium">
                「{guestName}」という名前で受付済みの記録があります。
              </p>
              <p className="mt-1 text-[11px] text-orange-600">このまま受付しますか？</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCheckin(true)}
                  className="flex-1 rounded-lg bg-orange-600 py-2 text-[12px] font-bold text-white"
                >
                  このまま受付する
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateGuest(false)}
                  className="flex-1 rounded-lg border border-[#d8e3dc] py-2 text-[12px] text-[#607083]"
                >
                  戻る
                </button>
              </div>
            </div>
          )}
        </div>

        {!duplicateGuest && (
          <button
            type="button"
            onClick={() => handleCheckin(false)}
            disabled={submitting || (!user && !guestName.trim())}
            className="w-full rounded-xl bg-[#315c4b] py-4 text-[15px] font-bold text-white shadow-sm disabled:opacity-50 active:scale-[0.98]"
          >
            {submitting ? "受付中..." : "チェックインする"}
          </button>
        )}

        {!user && (
          <p className="text-center text-[12px] text-[#607083]">
            <Link href="/auth" className="underline">ログイン</Link>すると名前入力が不要になります
          </p>
        )}
      </div>
    </div>
  );
}
