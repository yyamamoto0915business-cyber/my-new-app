"use client";

import { useSearchParams } from "next/navigation";
import { OrganizerGameCreateForm } from "@/components/organizer/games/OrganizerGameCreateForm";
import { OrganizerQuizCreateForm } from "@/components/organizer/games/OrganizerQuizCreateForm";

export function OrganizerGameCreateSwitch() {
  const type = useSearchParams().get("type");
  if (type === "quiz") return <OrganizerQuizCreateForm />;
  return <OrganizerGameCreateForm />;
}
