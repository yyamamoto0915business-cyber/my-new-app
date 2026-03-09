import Link from "next/link";
import { OrganizerAccountMenu } from "@/components/organizer/OrganizerAccountMenu";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="organizer-layout min-h-screen bg-[var(--mg-paper)]">
      {/* 共通ヘッダー：主催管理＋プロフィールメニュー（右上） */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur-sm dark:bg-[var(--background)] sm:px-6">
        <Link
          href="/organizer/events"
          className="text-base font-semibold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
        >
          主催管理
        </Link>
        <OrganizerAccountMenu />
      </header>
      {children}
    </div>
  );
}
