import { redirect } from "next/navigation";

/** 旧URL — ダッシュボードのクエリ付きURLへ統合 */
export default async function OrganizerEventDayRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizer?event=${encodeURIComponent(id)}`);
}
