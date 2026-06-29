"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Props = {
  variant?: "pc" | "mobile";
  className?: string;
};

export function VolunteerCtaBannerPair({ variant = "pc", className = "" }: Props) {
  const isPc = variant === "pc";

  return (
    <section
      aria-label="次のアクション"
      data-cta-variant={variant}
      className={`mg-volunteer-cta-section ${isPc ? "mg-volunteer-cta-section--pc" : "mg-volunteer-cta-section--mobile"} ${className}`.trim()}
    >
      <article className="mg-volunteer-cta-banner mg-volunteer-cta-banner--notify">
        <div className="mg-volunteer-cta-banner__bg" aria-hidden />
        <div className="mg-volunteer-cta-banner__gradient" aria-hidden />
        <div className="mg-volunteer-cta-banner__body">
          <h3 className="mg-volunteer-cta-banner__title mg-volunteer-cta-banner__title--notify">
            {isPc ? (
              <>
                新着のボランティアを
                <br className="mg-volunteer-cta-banner__title-br" />
                受け取りませんか？
              </>
            ) : (
              "新着ボランティアを受け取る"
            )}
          </h3>
          <p className="mg-volunteer-cta-banner__desc mg-volunteer-cta-banner__desc--notify">
            {isPc
              ? "あなたの希望に合った募集情報をお届けします。"
              : "希望に合う募集をお届けします。"}
          </p>
          <Link href="/profile" className="mg-volunteer-cta-btn mg-volunteer-cta-btn--green">
            <span>通知を受け取る</span>
            <ChevronRight className="mg-volunteer-cta-btn__icon" aria-hidden />
          </Link>
        </div>
      </article>

      <article className="mg-volunteer-cta-banner mg-volunteer-cta-banner--organizer">
        <div className="mg-volunteer-cta-banner__bg" aria-hidden />
        <div className="mg-volunteer-cta-banner__gradient" aria-hidden />
        <div className="mg-volunteer-cta-banner__body">
          <h3 className="mg-volunteer-cta-banner__title mg-volunteer-cta-banner__title--organizer">
            団体・主催者の方へ
          </h3>
          <p className="mg-volunteer-cta-banner__desc mg-volunteer-cta-banner__desc--organizer">
            {isPc
              ? "ボランティア募集を掲載して、地域の仲間を増やしませんか？"
              : "募集掲載で仲間を増やしませんか？"}
          </p>
          <Link
            href="/organizer/recruitments/new"
            className="mg-volunteer-cta-btn mg-volunteer-cta-btn--amber"
          >
            <span>募集を掲載する</span>
            <ChevronRight className="mg-volunteer-cta-btn__icon" aria-hidden />
          </Link>
        </div>
      </article>
    </section>
  );
}
