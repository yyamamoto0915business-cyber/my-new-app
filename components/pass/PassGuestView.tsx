import Link from "next/link";
import { PassCheckinActions } from "@/components/pass/PassCheckinActions";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";

type Props = {
  loginHref: string;
};

/**
 * ログインしていない人の参加パス画面。
 * 会場のQR読み取りと受付コードはログインなしで使えるので、それだけ出してログインを案内する。
 */
export function PassGuestView({ loginHref }: Props) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pb-6 pt-0 min-[900px]:pt-6">
      <header className="mb-3">
        <h1 className="text-[18px] font-semibold tracking-tight text-[#1a2818] min-[900px]:text-[22px]">
          参加パス
        </h1>
        <p className="mt-0.5 text-[12px] leading-snug text-[#5a665c]">
          会場のQRコードを読み取って、受付やゲームに参加できます
        </p>
      </header>

      <PassCheckinActions />

      <div className="mt-5 rounded-2xl border border-[#dde9e1] bg-white px-5 py-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef6f2]">
          <ParticipationPassIcon className="h-6 w-6" stroke="#2f7d4e" />
        </span>
        <p className="mt-3 text-[14px] font-semibold text-[#1a2818]">
          ログインすると参加パスが見られます
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#5a665c]">
          申し込んだイベントのパスや、参加の記録がここにまとまります。
        </p>
        <Link
          href={loginHref}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#2f7d4e] px-6 text-[13px] font-semibold text-white"
        >
          ログインする
        </Link>
      </div>
    </div>
  );
}
