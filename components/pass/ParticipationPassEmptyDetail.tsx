import Image from "next/image";
import { ParticipationPassSteps } from "@/components/pass/ParticipationPassSteps";

type Props = {
  title?: string;
  description?: string;
};

export function ParticipationPassEmptyDetail({
  title = "参加パスはまだありません",
  description = "申し込み・購入が完了したイベントのパスがここに表示されます",
}: Props) {
  return (
    <div
      aria-label="参加パス詳細の空状態"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-[#dce8de] bg-white px-5 pb-5 pt-5 shadow-[0_6px_20px_rgba(40,60,48,0.06)]"
    >
      <div className="flex shrink-0 justify-center">
        <Image
          src="/assets/machiglyph/pass/pass-empty-flow.png"
          alt=""
          width={160}
          height={110}
          className="h-[88px] w-auto object-contain"
          aria-hidden
        />
      </div>

      <div className="mt-2.5 shrink-0 text-center">
        <h2 className="text-[14px] font-semibold leading-snug text-[#1a2818]">
          {title}
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#6a7468]">
          {description}
        </p>
      </div>

      <div className="mt-4 shrink-0">
        <ParticipationPassSteps orientation="horizontal" />
      </div>
    </div>
  );
}
