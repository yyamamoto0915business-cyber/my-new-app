import { redirect } from "next/navigation";

/** 一覧はまちの情報ハブへ。詳細は /volunteer/[id] */
export default function VolunteerPage() {
  redirect("/?kind=volunteer");
}
