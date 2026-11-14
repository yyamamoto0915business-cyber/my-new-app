"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useOrganizerRole } from "@/hooks/use-organizer-role";
import { requiredRoleForPath } from "@/lib/organizer/role-routes";
import { ORGANIZER_ROLE_LABEL, roleAtLeast } from "@/lib/organizer/team";

/**
 * TEAM：役割が足りない画面を開いたときは、エラーではなく「この画面は○○以上が使えます」と出す。
 * 決まりは lib/organizer/role-routes.ts。役割の読み込み中と、主催者でない人（登録の案内は各画面が出す）は、そのまま中身を出す。
 */
export function OrganizerRoleGate({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const role = useOrganizerRole();
  const need = requiredRoleForPath(path);
  if (!role || roleAtLeast(role, need)) return <>{children}</>;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-2 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef1ec] text-[#5f6d64]" aria-hidden>
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="text-[18px] font-bold text-[#163828]">
        この画面は{ORGANIZER_ROLE_LABEL[need]}
        {need === "owner" ? "だけ" : "以上"}が使えます
      </h1>
      <p className="text-[13px] leading-relaxed text-[#5f6d64]">
        あなたはチームの「{ORGANIZER_ROLE_LABEL[role]}」です。必要なときは、チームのオーナーか管理者に権限を変えてもらってください。
      </p>
      <Link href="/organizer/home" className="mt-2 flex h-12 w-full items-center justify-center rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white">
        主催者ホームへ
      </Link>
    </div>
  );
}
