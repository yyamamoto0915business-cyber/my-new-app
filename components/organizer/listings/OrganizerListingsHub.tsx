"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  ExternalLink,
  Lightbulb,
  QrCode,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EventAccountStatusCards } from "@/components/organizer/events/EventAccountStatusCards";
import type { BillingSummary } from "@/app/api/organizer/dashboard/route";
import { buildPlanSummary, type PlanSummary } from "@/lib/organizer-plan-summary";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";

type ListingCategory = {
  id: string;
  title: string;
  description: [string, string];
  iconSrc: string;
  illustSrc: string;
  theme: "event" | "store" | "kitchen" | "volunteer";
  href?: string;
  comingSoon?: boolean;
};

const CATEGORIES: ListingCategory[] = [
  {
    id: "event",
    title: "イベント",
    description: ["地域のイベント・お祭り", "マルシェ・講座など"],
    iconSrc: "/organizer/listings/icon-event.png",
    illustSrc: "/organizer/listings/illust-event.png",
    theme: "event",
    href: "/organizer/events",
  },
  {
    id: "store",
    title: "店舗",
    description: ["飲食店・カフェ・スーパー", "八百屋・商店など"],
    iconSrc: "/organizer/listings/icon-store.png",
    illustSrc: "/organizer/listings/illust-store.png",
    theme: "store",
    href: "/organizer/stores",
  },
  {
    id: "kitchen",
    title: "キッチンカー",
    description: ["キッチンカーの出店情報や", "メニューを掲載します"],
    iconSrc: "/organizer/listings/icon-kitchen-car.png",
    illustSrc: "/organizer/listings/illust-kitchen-car.png",
    theme: "kitchen",
    href: "/organizer/kitchen-cars",
  },
  {
    id: "volunteer",
    title: "ボランティア募集",
    description: ["スタッフ・ボランティアの", "募集情報を掲載します"],
    iconSrc: "/organizer/listings/icon-volunteer.png",
    illustSrc: "/organizer/listings/illust-volunteer.png",
    theme: "volunteer",
    href: "/organizer/recruitments",
  },
];

function ListingCategoryCard({ category }: { category: ListingCategory }) {
  const content = (
    <>
      <div className="org-listings-hub__card-top">
        <div className="org-listings-hub__icon-wrap">
          <Image
            src={category.iconSrc}
            alt=""
            width={56}
            height={56}
            className="org-listings-hub__icon"
            unoptimized
          />
        </div>
        <h2 className="org-listings-hub__card-title">{category.title}</h2>
        <p className="org-listings-hub__card-desc">
          {category.description[0]}
          <br />
          {category.description[1]}
        </p>
        {category.comingSoon ? (
          <span className="org-listings-hub__soon">準備中</span>
        ) : null}
      </div>

      <div className="org-listings-hub__visual">
        <div className="org-listings-hub__illust-wrap">
          <Image
            src={category.illustSrc}
            alt=""
            width={360}
            height={220}
            className="org-listings-hub__illust"
            unoptimized
          />
        </div>
        <span className="org-listings-hub__arrow" aria-hidden>
          <ArrowRight className="h-3.5 w-3.5 min-[900px]:h-[15px] min-[900px]:w-[15px]" strokeWidth={2.6} />
        </span>
      </div>
    </>
  );

  if (category.href && !category.comingSoon) {
    return (
      <Link
        href={category.href}
        className={cn("org-listings-hub__card", `is-${category.theme}`)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn("org-listings-hub__card", `is-${category.theme}`, "is-disabled")}
      aria-disabled="true"
    >
      {content}
    </div>
  );
}

function AccountStatusSkeleton() {
  return (
    <div
      className="grid grid-cols-3 gap-1.5 sm:gap-2 min-[900px]:gap-3"
      aria-hidden
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[3.75rem] animate-pulse rounded-xl bg-[#e4ede0] min-[900px]:h-24 min-[900px]:rounded-2xl"
        />
      ))}
    </div>
  );
}

function toStatusProps(data: OrganizerBillingData): {
  planSummary: PlanSummary;
  billingSummary: BillingSummary;
} {
  const chargesEnabled = !!data.organizer.stripe_account_charges_enabled;
  return {
    planSummary: buildPlanSummary(data.organizer, data.monthlyPublished),
    billingSummary: {
      totalSales: 0,
      pendingPayout: 0,
      paymentSetupStatus: chargesEnabled ? "ok" : "unset",
      stripeAccountChargesEnabled: chargesEnabled,
    },
  };
}

/** 掲載管理ハブ — 種別選択カード */
export function OrganizerListingsHub() {
  const [planSummary, setPlanSummary] = useState<PlanSummary | null>(null);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing", { cache: "no-store" });
        const json = (await res.json()) as OrganizerBillingData;
        if (!res.ok || cancelled) return;
        const mapped = toStatusProps(json);
        setPlanSummary(mapped.planSummary);
        setBillingSummary(mapped.billingSummary);
      } catch {
        if (!cancelled) {
          setPlanSummary(null);
          setBillingSummary(null);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="org-listings-hub">
      <div className="org-listings-hub__status">
        {statusLoading ? (
          <AccountStatusSkeleton />
        ) : (
          <EventAccountStatusCards
            planSummary={planSummary}
            billingSummary={billingSummary}
          />
        )}
      </div>

      <div className="org-listings-hub__grid">
        {CATEGORIES.map((category) => (
          <ListingCategoryCard key={category.id} category={category} />
        ))}
      </div>

      <section className="org-listings-hub__pos" aria-labelledby="listings-pos-heading">
        <div className="org-listings-hub__pos-copy">
          <div className="org-listings-hub__pos-title-row">
            <h2 id="listings-pos-heading">レジ・当日販売</h2>
            <span className="org-listings-hub__pos-badge">NEW</span>
          </div>
          <p>会場での物販や参加パスの会計を、その場でスムーズに行えます。</p>
          <ul className="org-listings-hub__pos-tags">
            <li>
              <Banknote className="h-3.5 w-3.5" aria-hidden />
              現金対応
            </li>
            <li>
              <CreditCard className="h-3.5 w-3.5" aria-hidden />
              クレジット
            </li>
            <li>
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              QR・オンライン
            </li>
            <li>
              <Receipt className="h-3.5 w-3.5" aria-hidden />
              売上確認
            </li>
          </ul>
        </div>
        <div className="org-listings-hub__pos-visual" aria-hidden>
          <div className="org-listings-hub__pos-device">
            <span className="org-listings-hub__pos-device-screen" />
            <span className="org-listings-hub__pos-device-base" />
          </div>
        </div>
        <div className="org-listings-hub__pos-cta">
          <Link href="/organizer/pos" className="org-listings-hub__pos-btn">
            レジを開く
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p>かんたんな操作でスムーズに会計。売上もすぐ確認できます。</p>
        </div>
      </section>

      <section className="org-listings-hub__about" aria-labelledby="listings-about-heading">
        <div className="org-listings-hub__about-copy">
          <div className="org-listings-hub__about-heading">
            <Lightbulb className="org-listings-hub__about-icon" aria-hidden />
            <h2 id="listings-about-heading">掲載について</h2>
          </div>
          <p>
            掲載した情報は MachiGlyph の利用者に公開されます。
            <br className="hidden min-[900px]:inline" />
            ガイドラインを守って、わかりやすい情報を届けましょう。
          </p>
        </div>
        <Link
          href="/guide"
          target="_blank"
          rel="noopener noreferrer"
          className="org-listings-hub__guide-btn"
        >
          掲載ガイドラインを見る
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
