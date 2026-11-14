import { notFound } from "next/navigation";
import { RecruitmentDetailClient } from "./recruitment-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

import { ListingViewBeacon } from "@/components/analytics/ListingViewBeacon";

export default async function RecruitmentDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  return (
    <>
      <ListingViewBeacon kind="recruitment" id={id} />
      <RecruitmentDetailClient recruitmentId={id} />
    </>
  );
}
