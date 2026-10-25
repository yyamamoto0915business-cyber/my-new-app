import { redirect } from "next/navigation";
import { getEventPassHref } from "@/lib/event-purchase";

type Props = {
  params: Promise<{ id: string }>;
};

/** 以前のイベント別の参加パス。参加パスの画面で、そのイベントのパスを開く。 */
export default async function EventPassPage({ params }: Props) {
  const { id } = await params;
  redirect(getEventPassHref(id));
}
