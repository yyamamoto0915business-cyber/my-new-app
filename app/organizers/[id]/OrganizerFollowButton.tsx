"use client";

import { useState } from "react";

type Props = {
  className?: string;
  fullWidth?: boolean;
  mobileStyle?: boolean;
  pcStyle?: boolean;
};

export function OrganizerFollowButton({
  className = "",
  fullWidth = false,
  mobileStyle = false,
  pcStyle = false,
}: Props) {
  const [followed, setFollowed] = useState(false);
  const roundedClass = mobileStyle || pcStyle ? "rounded-xl" : "rounded-full";

  return (
    <button
      onClick={() => setFollowed((v) => !v)}
      className={`flex items-center justify-center gap-2 font-semibold transition-all ${roundedClass} ${
        pcStyle ? "min-w-0 flex-1" : fullWidth ? "w-full" : "flex-1"
      } ${mobileStyle || pcStyle ? "h-11 text-[14px]" : ""} ${className}`}
      style={
        followed
          ? {
              background: "#fff",
              color: "#3a8040",
              border: "1.5px solid #3a8040",
              padding: mobileStyle || pcStyle ? "0" : "12px 0",
              fontSize: mobileStyle ? 13 : 14,
            }
          : {
              background: "#3a8040",
              color: "#fff",
              border: "none",
              padding: mobileStyle || pcStyle ? "0" : "12px 0",
              fontSize: mobileStyle ? 13 : 14,
            }
      }
    >
      {followed ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          フォロー中
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          フォローする
        </>
      )}
    </button>
  );
}
