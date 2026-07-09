"use client";

import { useState } from "react";
import { buildProfileInitials } from "@/lib/profile-avatar";

/** バナー用アバター（固定サイズ・任意URLの img で表示） */
export function ProfileBannerAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = avatarUrl && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 外部URLもそのまま表示
      <img
        src={avatarUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[#3d8a5c] text-[11px] font-bold text-white/90">
      {buildProfileInitials(displayName)}
    </span>
  );
}
