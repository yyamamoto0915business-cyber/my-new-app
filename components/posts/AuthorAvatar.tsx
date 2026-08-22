"use client";

import { useState } from "react";

type Props = {
  name: string;
  src?: string | null;
};

export function AuthorAvatar({ name, src }: Props) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="posts-avatar-photo"
        onError={() => setFailed(true)}
      />
    );
  }

  return initial;
}
