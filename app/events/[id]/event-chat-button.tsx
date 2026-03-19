"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventChatButtonProps = {
  eventId: string;
  eventTitle?: string;
  organizerName?: string;
  ctaLabel?: string;
  ctaHelper?: string;
  openSignal?: number;
  openIntentId?: string;
};

type IntentOption = {
  id: string;
  label: string;
  template: string;
};

const INTENTS: IntentOption[] = [
  { id: "question", label: "質問したい", template: "イベントについて質問したいです。" },
  { id: "consult", label: "参加相談", template: "参加について相談したいです。" },
  { id: "bring", label: "持ち物", template: "持ち物について教えてください。" },
  { id: "meeting", label: "集合場所", template: "集合場所はどちらでしょうか。" },
  { id: "weather", label: "雨天時", template: "雨天時は開催されますか？" },
  { id: "volunteer", label: "ボランティア", template: "ボランティア参加は可能でしょうか。" },
  { id: "cancel", label: "キャンセルを相談したい", template: "キャンセル方法について確認したいです。" },
  { id: "other", label: "その他", template: "" },
];

export function EventChatButton({
  eventId,
  eventTitle,
  organizerName,
  ctaLabel = "このイベントについて相談する",
  ctaHelper = "参加前の質問や相談ができます。主催者へ直接確認できます。",
  openSignal,
  openIntentId,
}: EventChatButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<"loading" | "logged_in" | "logged_out" | "no_supabase">("loading");
  const [modalOpen, setModalOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [conversationIdForModal, setConversationIdForModal] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [modalIntentId, setModalIntentId] = useState<string>("question");
  // `ctaLabel` / `ctaHelper` は外側のUI（相談カード）から文言を揃えるために差し替え可能にしています

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthState("no_supabase");
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthState(!!user ? "logged_in" : "logged_out");
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(!!session?.user ? "logged_in" : "logged_out");
    });
    return () => subscription.unsubscribe();
  }, []);

  const currentEventUrl = `${pathname ?? `/events/${eventId}`}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleOpenModal = async (intentId?: string) => {
    if (opening) return;
    setOpening(true);
    setOpenError(null);
    setModalIntentId(intentId ?? "question");
    try {
      // 既存conversationがある場合は、モーダルを挟まず会話詳細へ直行
      // 初回（messages 0件）のときだけモーダル表示
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, kind: "event_inquiry" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "会話の準備に失敗しました");
      const conversationId = data?.conversationId as string | undefined;
      if (!conversationId) throw new Error("会話IDが返ってきませんでした");

      const msgRes = await fetch(`/api/messages/conversations/${conversationId}/messages`);
      const msgs = (await msgRes.json().catch(() => [])) as unknown;
      const hasAnyMessages = Array.isArray(msgs) ? msgs.length > 0 : false;

      if (hasAnyMessages) {
        router.push(`/messages/${conversationId}`);
        return;
      }

      setConversationIdForModal(conversationId);
      setModalOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "開けませんでした。もう一度お試しください。";
      setOpenError(msg);
    } finally {
      setOpening(false);
    }
  };
  const handleCloseModal = () => setModalOpen(false);

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  useEffect(() => {
    if (!openSignal || openSignal <= 0) return;
    if (authState === "no_supabase") return;

    if (authState === "logged_out" && !authDisabled) {
      window.location.href = `/auth?next=${encodeURIComponent(currentEventUrl)}`;
      return;
    }

    handleOpenModal(openIntentId ?? "question");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal, openIntentId, authState, authDisabled]);

  if (authState === "loading") return null;

  if (authState === "no_supabase") {
    return (
      <p className="text-sm text-zinc-500">
        主催者への質問は Supabase 連携時にご利用ください。{" "}
        <Link
          href={`/events/${eventId}/chat`}
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          設定方法を見る
        </Link>
      </p>
    );
  }

  if (authState === "logged_out" && !authDisabled) {
    return (
      <div className="w-full">
        <Link
          href={`/auth?next=${encodeURIComponent(currentEventUrl)}`}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {ctaLabel}
        </Link>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">{ctaHelper}</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <button
          type="button"
          onClick={() => handleOpenModal()}
          disabled={opening}
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {opening ? "準備中..." : ctaLabel}
        </button>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">{ctaHelper}</p>
        {openError && <p className="mt-2 text-xs text-red-600">{openError}</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseModal}
            aria-label="閉じる"
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white px-4 pt-4 shadow-xl dark:bg-zinc-900"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <ModalBody
              eventId={eventId}
              conversationId={conversationIdForModal}
              eventTitle={eventTitle}
              organizerName={organizerName}
              initialIntentId={modalIntentId}
              onClose={() => {
                setModalOpen(false);
                setConversationIdForModal(null);
              }}
              router={router}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ModalBody({
  eventId,
  conversationId,
  eventTitle,
  organizerName,
  initialIntentId,
  onClose,
  router,
}: {
  eventId: string;
  conversationId?: string | null;
  eventTitle?: string;
  organizerName?: string;
  initialIntentId?: string;
  onClose: () => void;
  router: { push: (href: string) => void };
}) {
  const [intentId, setIntentId] = useState<string>(initialIntentId ?? "question");
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selected = INTENTS.find((i) => i.id === intentId);
    setMessage(selected?.template ?? "");
    setError(null);
  }, [intentId]);

  const draft = message.trim();

  const handleSend = async () => {
    if (sending) return;
    if (!draft) {
      setError("メッセージを入力してください");
      return;
    }

    setSending(true);
    setError(null);
    try {
      let cid = conversationId ?? null;
      if (!cid) {
        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, kind: "event_inquiry" }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "会話の作成に失敗しました");

        cid = data?.conversationId as string | undefined ?? null;
        if (!cid) throw new Error("会話IDが返ってきませんでした");
      }

      const supabase = createClient();
      if (!supabase) throw new Error("Supabase が設定されていません");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: cid,
        sender_id: user.id,
        content: draft,
      });

      if (insertError) throw insertError;

      onClose();
      router.push(`/messages/${cid}`);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "送信に失敗しました。もう一度お試しください";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex max-h-[85vh] flex-col">
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              主催者にメッセージを送る
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {eventTitle ? `「${eventTitle}」について` : "このイベントについて"}{" "}
              {organizerName ? `主催者：${organizerName} さん` : "主催者にお話ししましょう"}
            </p>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              気になることがあれば、主催者に聞いてみましょう。参加前の確認にも使えます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            閉じる
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            用件を選ぶと、下書きが入ります
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTENTS.map((opt) => {
              const selected = opt.id === intentId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntentId(opt.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-3 border-t border-[var(--border)] bg-white pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] dark:bg-zinc-900">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
          placeholder="イベントについて質問したいです"
          rows={4}
          className="w-full resize-none rounded-2xl border border-[var(--border)] bg-zinc-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 dark:bg-zinc-800 dark:text-zinc-100"
        />

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft}
            className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "送信中..." : "送信して会話を始める"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            あとで
          </button>
        </div>
      </div>
    </div>
  );
}
