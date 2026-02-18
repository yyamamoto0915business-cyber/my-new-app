"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  url?: string;
  title?: string;
  variant?: "default" | "compact";
};

const btnClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

export function ShareButton({ url, title, variant = "default" }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = url
      ? url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url?.startsWith("/") ? url : `/${url}`}`
      : typeof window !== "undefined" ? window.location.href : "";
    setFullUrl(u);
  }, [url]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const handleCopy = async () => {
    const u = fullUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(u);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      setOpen(false);
    }
  };

  const encodedUrl = encodeURIComponent(fullUrl || "");
  const shareText = encodeURIComponent(title ?? "このイベントを見てみませんか？");
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;

  if (variant === "compact") {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`${btnClass} gap-1.5 py-1.5`}
          aria-expanded={open}
        >
          共有
          <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
            <button type="button" onClick={handleCopy} className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
              {copied ? "✓ コピーしました" : "リンクをコピー"}
            </button>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700" onClick={() => setOpen(false)}>
              X で共有
            </a>
            <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700" onClick={() => setOpen(false)}>
              LINE で共有
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className={btnClass} aria-expanded={open}>
        共有 ▼
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-800">
          <button type="button" onClick={handleCopy} className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
            {copied ? "✓ コピーしました" : "リンクをコピー"}
          </button>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700" onClick={() => setOpen(false)}>
            X で共有
          </a>
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700" onClick={() => setOpen(false)}>
            LINE で共有
          </a>
        </div>
      )}
    </div>
  );
}
