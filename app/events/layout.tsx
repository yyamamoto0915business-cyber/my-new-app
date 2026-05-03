"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const CATEGORY_ITEMS = [
  { label: "すべて", value: "" },
  { label: "音楽・芸術", value: "music" },
  { label: "食・グルメ", value: "food" },
  { label: "スポーツ", value: "sports" },
  { label: "文化・伝統", value: "culture" },
  { label: "自然・アウトドア", value: "outdoor" },
  { label: "教育・学習", value: "education" },
  { label: "交流・コミュニティ", value: "community" },
] as const;

const TAG_ITEMS = [
  { label: "無料", value: "free" },
  { label: "親子向け", value: "kids" },
  { label: "初心者歓迎", value: "beginner" },
] as const;

function PcSidebar() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";
  const currentTag = searchParams.get("tag") ?? "";

  function buildHref(type: "category" | "tag", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    const qs = params.toString();
    return `/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <aside className="hidden min-[900px]:block min-[900px]:w-[200px] min-[900px]:shrink-0 min-[900px]:border-r min-[900px]:border-[#ccc4b4] min-[900px]:bg-[#faf8f2]">
      <div className="px-[14px] py-[18px] space-y-5">
        {/* カテゴリ */}
        <div>
          <div
            className="mb-[6px] flex items-center gap-[5px] text-[9px] tracking-[0.14em] text-[#a8a090]"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            <span className="whitespace-nowrap">カテゴリ</span>
            <div className="h-px flex-1 bg-[#ccc4b4] opacity-70" />
          </div>
          <ul className="space-y-0.5">
            {CATEGORY_ITEMS.map((item) => {
              const active = currentCategory === item.value;
              return (
                <li key={item.value}>
                  <Link
                    href={buildHref("category", item.value)}
                    className={`block whitespace-nowrap rounded-[7px] px-[9px] py-[6px] text-[11px] transition-colors ${
                      active
                        ? "bg-[#1e3848] text-[#f4f0e8]"
                        : "text-[#3a3428] hover:bg-[#f0ece4]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* タグ */}
        <div>
          <div
            className="mb-[6px] flex items-center gap-[5px] text-[9px] tracking-[0.14em] text-[#a8a090]"
            style={{ fontFamily: "'Shippori Mincho', serif" }}
          >
            <span className="whitespace-nowrap">タグ</span>
            <div className="h-px flex-1 bg-[#ccc4b4] opacity-70" />
          </div>
          <ul className="space-y-0.5">
            {TAG_ITEMS.map((item) => {
              const active = currentTag === item.value;
              return (
                <li key={item.value}>
                  <Link
                    href={buildHref("tag", item.value)}
                    className={`block whitespace-nowrap rounded-[7px] px-[9px] py-[6px] text-[11px] transition-colors ${
                      active
                        ? "bg-[#1e3848] text-[#f4f0e8]"
                        : "text-[#3a3428] hover:bg-[#f0ece4]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-[900px]:flex-row">
      <Suspense fallback={null}>
        <PcSidebar />
      </Suspense>
      <div className="min-w-0 flex-1 min-[900px]:bg-[#f4f0e8]">{children}</div>
    </div>
  );
}
