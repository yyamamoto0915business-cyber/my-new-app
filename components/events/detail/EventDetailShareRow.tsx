"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

type Props = {
  shareUrl: string;
  title: string;
};

export function EventDetailShareRow({ shareUrl, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(shareUrl);

  useEffect(() => {
    if (shareUrl.startsWith("http")) {
      setFullUrl(shareUrl);
      return;
    }
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    setFullUrl(`${origin}${shareUrl.startsWith("/") ? shareUrl : `/${shareUrl}`}`);
  }, [shareUrl]);

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      className: "bg-zinc-900 text-white hover:bg-zinc-800",
    },
    {
      label: "f",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: "bg-[#1877f2] text-white hover:bg-[#166fe5]",
    },
    {
      label: "LINE",
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      className: "bg-[#06c755] text-white hover:bg-[#05b34c]",
    },
  ] as const;

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-semibold text-[var(--mg-ink)]">シェアする</p>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-xs font-bold transition ${item.className}`}
            aria-label={`${item.label}で共有`}
          >
            {item.label}
          </a>
        ))}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mg-line)] bg-white text-[var(--mg-muted)] transition hover:bg-zinc-50"
          aria-label="リンクをコピー"
        >
          <Link2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {copied ? (
        <p className="text-xs text-[var(--accent)]">リンクをコピーしました</p>
      ) : null}
    </div>
  );
}
