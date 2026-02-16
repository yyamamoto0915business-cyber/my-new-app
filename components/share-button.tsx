"use client";

import { useState, useEffect } from "react";

type Props = {
  /** 共有するパスまたはURL（例: /events/123。省略時は現在のページ） */
  url?: string;
  /** 共有時に使うテキスト（SNS投稿用） */
  title?: string;
  /** ボタンの見た目 */
  variant?: "default" | "compact";
};

export function ShareButton({ url, title, variant = "default" }: Props) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState<string>("");

  useEffect(() => {
    const u = url
      ? url.startsWith("http")
        ? url
        : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`
      : window.location.href;
    setFullUrl(u);
  }, [url]);

  const handleCopy = async () => {
    const u = fullUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(u);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const u = fullUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title ?? "イベント",
          url: u,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const encodedUrl = encodeURIComponent(fullUrl || "");
  const shareText = encodeURIComponent(title ?? "このイベントを見てみませんか？");
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;

  const baseClass =
    "inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={`${baseClass} py-1.5`}
        >
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} py-1.5 no-underline`}
        >
          X で共有
        </a>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} py-1.5 no-underline`}
        >
          LINE で共有
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        リンクを共有する
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={baseClass}
        >
          {copied ? "コピーしました！" : "リンクをコピー"}
        </button>
        <button
          type="button"
          onClick={handleNativeShare}
          className={baseClass}
        >
          共有
        </button>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} no-underline`}
        >
          X で共有
        </a>
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} no-underline`}
        >
          LINE で共有
        </a>
      </div>
    </div>
  );
}
