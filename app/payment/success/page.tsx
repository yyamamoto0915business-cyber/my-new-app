import Link from "next/link";
import { getStripe } from "@/lib/stripe";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

type SessionKind =
  | { type: "subscription" }
  | { type: "event"; eventId: string }
  | { type: "support"; eventId: string }
  | { type: "generic" };

async function resolveSession(sessionId: string | undefined): Promise<SessionKind> {
  if (!sessionId) return { type: "generic" };
  const stripe = getStripe();
  if (!stripe) return { type: "generic" };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.mode === "subscription") return { type: "subscription" };
    const meta = session.metadata ?? {};
    if (meta.type === "event" && meta.eventId) return { type: "event", eventId: meta.eventId };
    if (meta.type === "support" && meta.eventId) return { type: "support", eventId: meta.eventId };
    return { type: "generic" };
  } catch {
    return { type: "generic" };
  }
}

const CARD_CLS =
  "rounded-2xl border border-[var(--mg-line)] bg-white p-8 shadow-[var(--mg-shadow)] dark:bg-zinc-900/50";
const PRIMARY_BTN =
  "flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl bg-[var(--mg-accent)] py-3 font-medium text-white transition-opacity hover:opacity-90";
const SECONDARY_BTN =
  "flex min-h-[var(--mg-touch-min)] w-full items-center justify-center rounded-xl border border-[var(--mg-line)] py-3 font-medium text-[var(--mg-ink)] transition hover:bg-zinc-50 dark:hover:bg-zinc-800";

function CheckIcon() {
  return (
    <div className="flex justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
  );
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const kind = await resolveSession(session_id);

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <main className="mx-auto max-w-md px-4 py-16">
        <div className={CARD_CLS}>
          <CheckIcon />

          {kind.type === "subscription" && (
            <>
              <h1 className="mt-6 text-center text-xl font-bold text-[var(--mg-ink)]">
                主催者プランが有効になりました
              </h1>
              <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
                ご登録ありがとうございます。イベントを無制限に公開できるようになりました。
              </p>
              <div className="mt-8 space-y-4">
                <Link href="/organizer/settings/plan" className={PRIMARY_BTN}>
                  プラン・お支払い管理へ
                </Link>
                <Link href="/organizer" className={SECONDARY_BTN}>
                  ダッシュボードへ
                </Link>
              </div>
            </>
          )}

          {kind.type === "event" && (
            <>
              <h1 className="mt-6 text-center text-xl font-bold text-[var(--mg-ink)]">
                参加申込が完了しました
              </h1>
              <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
                お支払いが確認できました。当日のご参加をお待ちしています。
              </p>
              <div className="mt-8 space-y-4">
                <Link href={`/events/${kind.eventId}`} className={PRIMARY_BTN}>
                  イベントページへ戻る
                </Link>
                <Link href="/profile" className={SECONDARY_BTN}>
                  マイページで確認する
                </Link>
              </div>
            </>
          )}

          {kind.type === "support" && (
            <>
              <h1 className="mt-6 text-center text-xl font-bold text-[var(--mg-ink)]">
                応援ありがとうございます！
              </h1>
              <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
                あなたの応援がイベントを支えます。引き続き MachiGlyph をお楽しみください。
              </p>
              <div className="mt-8 space-y-4">
                <Link href={`/events/${kind.eventId}`} className={PRIMARY_BTN}>
                  イベントページへ戻る
                </Link>
                <Link href="/" className={SECONDARY_BTN}>
                  トップへ戻る
                </Link>
              </div>
            </>
          )}

          {kind.type === "generic" && (
            <>
              <h1 className="mt-6 text-center text-xl font-bold text-[var(--mg-ink)]">
                お支払いが完了しました
              </h1>
              <p className="mt-2 text-center text-sm text-[var(--mg-muted)]">
                ご利用ありがとうございます。引き続き MachiGlyph をお楽しみください。
              </p>
              <div className="mt-8 space-y-4">
                <Link href="/" className={PRIMARY_BTN}>
                  トップへ戻る
                </Link>
                <Link href="/profile" className={SECONDARY_BTN}>
                  マイページへ
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
