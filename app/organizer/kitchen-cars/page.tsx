import { redirect } from "next/navigation";

/** 種類ごとの管理は「掲載管理」にまとめた（スマホ・PC 共通）。古いリンクのために、掲載管理のこの種類へ移す */
export default function Page() {
  redirect("/organizer/listings?kind=kitchen");
}
