import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForPublicPage } from "@/lib/get-event-for-page";
import { getApiUser } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { getParticipantStatus } from "@/lib/db/events";
import { getLoginUrl } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * マイ参加パス画面（仮）
 * 購入後の受付用QR表示は今後ここに拡張する。
 */
export default async function EventPassPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventForPublicPage(id);
  if (!event) notFound();

  const user = await getApiUser();
  if (!user) {
    redirect(getLoginUrl(`/events/${id}/pass`));
  }

  const supabase = await createClient();
  let hasPass = false;
  if (supabase) {
    const status = await getParticipantStatus(supabase, id, user.id);
    hasPass =
      status === "applied" ||
      status === "confirmed" ||
      status === "checked_in" ||
      status === "completed";
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-[12px] font-medium text-[#8a9e80]">マイ参加パス</p>
      <h1 className="mt-1 text-xl font-bold text-[#1a2818]">{event.title}</h1>

      {hasPass ? (
        <div className="mt-6 rounded-2xl border border-[#e8edd8] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-xl bg-[#eef6f0] text-[13px] font-medium text-[#348b38]">
            QRコード準備中
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-[#526448]">
            受付用QRコードは近日表示できるようになります。
            <br />
            当日は主催者の案内に従ってご来場ください。
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-[#e8edd8] bg-white p-6 text-center shadow-sm">
          <p className="text-[13px] leading-relaxed text-[#526448]">
            このイベントの参加パスはまだありません。
          </p>
          <Link
            href={`/events/${id}`}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#348b38] px-5 text-[14px] font-bold text-white transition hover:bg-[#2d7a32]"
          >
            イベント詳細へ戻る
          </Link>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          href={`/events/${id}`}
          className="text-[13px] font-medium text-[#348b38] hover:underline"
        >
          イベント詳細を見る
        </Link>
      </div>
    </div>
  );
}
