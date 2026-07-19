import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ eventId?: string }>;
};

/**
 * 互換用。実際のイベント詳細上で確認シートを見る。
 * /events/[id]?previewApplyConfirm=1 へ誘導する。
 */
export default async function ApplyConfirmPreviewRedirectPage({
  searchParams,
}: Props) {
  const { eventId } = await searchParams;
  if (eventId) {
    redirect(`/events/${eventId}?previewApplyConfirm=1`);
  }

  // イベントID未指定時は説明ページ（クライアントなしの軽い誘導）
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-xl font-bold text-[#1a2818]">申し込み確認のプレビュー</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#5c6b56]">
        背景をイベント詳細にした状態で見るには、見たいイベントのURLに
        <code className="mx-1 rounded bg-[#eef3e8] px-1.5 py-0.5 text-[13px]">
          ?previewApplyConfirm=1
        </code>
        を付けてください。
      </p>
      <p className="mt-4 text-[13px] text-[#6a7a64]">
        例:
        <br />
        <code className="mt-1 block break-all rounded-lg border border-[#e4ebdc] bg-white px-3 py-2 text-[12.5px] text-[#348b38]">
          /events/（イベントID）?previewApplyConfirm=1
        </code>
      </p>
    </div>
  );
}
