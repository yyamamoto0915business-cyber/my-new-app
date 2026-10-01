"use client";

import { useSearchParams } from "next/navigation";
import { OrganizerCheckinCreateForm } from "@/components/organizer/games/OrganizerCheckinCreateForm";
import { OrganizerCouponCreateForm } from "@/components/organizer/games/OrganizerCouponCreateForm";
import { OrganizerGameCreateForm } from "@/components/organizer/games/OrganizerGameCreateForm";
import { OrganizerMissionCreateForm } from "@/components/organizer/games/OrganizerMissionCreateForm";
import { OrganizerPhotoCreateForm } from "@/components/organizer/games/OrganizerPhotoCreateForm";
import { OrganizerQuizCreateForm } from "@/components/organizer/games/OrganizerQuizCreateForm";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { isDevPreviewSuccessQuery } from "@/lib/dev-publish-success-preview";
import { getOrganizerGameType, isOrganizerGameTypeId } from "@/lib/organizer/game-types";

export function OrganizerGameCreateSwitch() {
  const params = useSearchParams();
  const type = params.get("type");
  if (isDevPreviewSuccessQuery(params.get("previewSuccess"))) {
    const raw = type ?? "";
    const typeLabel = isOrganizerGameTypeId(raw)
      ? getOrganizerGameType(raw).label
      : "ゲーム";
    return <GamePublishSuccess typeLabel={typeLabel} isPreview />;
  }
  if (type === "quiz") return <OrganizerQuizCreateForm />;
  if (type === "mission") return <OrganizerMissionCreateForm />;
  if (type === "photo") return <OrganizerPhotoCreateForm />;
  if (type === "coupon") return <OrganizerCouponCreateForm />;
  if (type === "checkin") return <OrganizerCheckinCreateForm />;
  return <OrganizerGameCreateForm />;
}
