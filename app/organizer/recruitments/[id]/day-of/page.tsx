import { redirect } from "next/navigation";

/**
 * 当日管理は応募管理に統合。旧URLのブックマーク・リンク切れ防止のためリダイレクトする。
 */
export default async function DayOfModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/organizer/recruitments/${id}`);
}
