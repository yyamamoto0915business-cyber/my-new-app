"use client";

import { useRouter } from "next/navigation";
import { RecruitmentForm } from "@/components/recruitment-form";
import { Breadcrumb } from "@/components/breadcrumb";

export default function NewRecruitmentPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "主催", href: "/organizer/events" },
              { label: "募集管理", href: "/organizer/recruitments" },
              { label: "新規作成" },
            ]}
          />
          <h1 className="mt-2 text-xl font-bold">募集を新規作成</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
          <RecruitmentForm
            onSuccess={(id) => router.push(`/organizer/recruitments/${id}`)}
            onCancel={() => router.push("/organizer/recruitments")}
          />
        </div>
      </main>
    </div>
  );
}
