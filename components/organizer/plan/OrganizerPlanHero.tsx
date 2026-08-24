"use client";

import Image from "next/image";

/** 主催者プラン — PCヒーロー（他ワークスペース画面と同系） */
export function OrganizerPlanHero() {
  return (
    <section className="org-plan-page__hero" aria-label="主催者プラン">
      <div className="flex items-start gap-2.5">
        <Image
          src="/organizer/plan/starter-leaf.png"
          alt=""
          width={36}
          height={36}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-full"
          unoptimized
        />
        <div className="min-w-0">
          <h1 className="org-plan-page__title">主催者プラン</h1>
          <p className="org-plan-page__desc">
            活動の広がりに合わせて、ぴったりのプランを選べます。
          </p>
        </div>
      </div>
    </section>
  );
}
