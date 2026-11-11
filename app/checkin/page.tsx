import { redirect } from "next/navigation";

/**
 * チェックインは参加パス画面にまとめた（QRの読み取り・受付コードは /pass の上にある）。
 * QR読み取り（/checkin/scan）と受付（/checkin/t/[token]）は、印刷済みのQRが指しているので残す。
 */
export default function CheckinPage() {
  redirect("/pass");
}
