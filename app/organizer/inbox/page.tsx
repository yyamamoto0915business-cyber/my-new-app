import { redirect } from "next/navigation";

/**
 * 旧「受信箱」。試作の仮データ（lib/dm-mock、サーバーのメモリだけ）を読んでいて実際には使えなかったので、
 * 本物のやりとり（参加者・ボランティア応募者とのチャット）がある /messages へまとめる。
 */
export default function OrganizerInboxRedirectPage() {
  redirect("/messages");
}
