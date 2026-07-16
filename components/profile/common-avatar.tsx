"use client";

import Image from "next/image";
import { useState } from "react";
import { buildProfileInitials } from "@/lib/profile-avatar";

type Props = {
  avatarUrl?: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  initialsClassName?: string;
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-[12px]",
  lg: "h-16 w-16 text-[20px]",
};

export function CommonAvatar({
  avatarUrl,
  displayName,
  size = "md",
  className,
  initialsClassName,
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = buildProfileInitials(displayName);
  const showImage = Boolean(avatarUrl) && avatarUrl !== failedUrl;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d8eae4] ${SIZE_CLASS[size]} ${className ?? ""}`}
      aria-label={displayName}
    >
      {showImage && avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized={!avatarUrl.includes("supabase.co")}
          sizes={size === "lg" ? "64px" : size === "md" ? "36px" : "32px"}
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        <span className={`font-bold text-[#1a3428] ${initialsClassName ?? ""}`}>{initials}</span>
      )}
    </div>
  );
}
