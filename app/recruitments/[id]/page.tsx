import { notFound } from "next/navigation";
import { RecruitmentDetailClient } from "./recruitment-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RecruitmentDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  return <RecruitmentDetailClient recruitmentId={id} />;
}
