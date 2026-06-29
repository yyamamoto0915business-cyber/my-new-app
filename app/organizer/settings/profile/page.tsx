"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrganizerProfileSettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile/edit?tab=organizer");
  }, [router]);
  return null;
}
