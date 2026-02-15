import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecruitmentDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-600">募集詳細: {id}</p>
    </div>
  );
}
