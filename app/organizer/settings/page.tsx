"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { OrganizerSettingsHeroBanner } from "@/components/organizer/OrganizerSettingsHeroBanner";
import { OrganizerHeroBleed, OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";
import { getPlanLabel, getSlotsLabel, getReceivingStatus } from "@/lib/organizer-billing-display";
import type { OrganizerBillingData } from "@/lib/organizer-billing-types";
import { SECTION_TONES, type SectionTone } from "@/lib/section-tones";
import { OrganizerSettingsMobileView } from "@/components/organizer/settings/OrganizerSettingsMobileView";

const CARD_GAP = "gap-2.5 min-[900px]:gap-3";

// ── shared sub-components ──────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  tone,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  tone: SectionTone;
  children: React.ReactNode;
  className?: string;
}) {
  const t = SECTION_TONES[tone];
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border-[0.5px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] ${className}`}
      style={{ borderColor: t.border, background: t.bodyBg }}
    >
      <div
        className="flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5 min-[900px]:py-2"
        style={{ background: t.header, borderColor: `${t.border}99` }}
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-[14px] [&_svg]:w-[14px]">
          {icon}
        </span>
        <span className="text-[12px] font-[500]" style={{ color: t.headerText }}>
          {title}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-2.5 min-[900px]:p-3">{children}</div>
    </div>
  );
}

function InfoRows({
  rows,
  tone,
}: {
  rows: { label: string; value: string; valueClassName?: string }[];
  tone: SectionTone;
}) {
  const t = SECTION_TONES[tone];
  return (
    <div className="mb-2 overflow-hidden rounded-md border-[0.5px]" style={{ borderColor: t.infoBorder, background: t.infoBg }}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="flex items-start justify-between gap-2 px-2.5 py-1.5 min-[900px]:py-[7px]"
          style={{
            background: t.infoBg,
            borderBottom: i < rows.length - 1 ? `0.5px solid ${t.infoBorder}` : "none",
          }}
        >
          <span className="shrink-0 pt-px text-[10px] font-medium" style={{ color: t.label }}>
            {r.label}
          </span>
          <span
            className={`min-w-0 break-all text-right text-[11px] leading-snug text-[#1a1a1a] min-[900px]:text-[12px] ${r.valueClassName ?? ""}`}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SettingBtn({ href, tone, children }: { href: string; tone: SectionTone; children: React.ReactNode }) {
  const t = SECTION_TONES[tone];
  return (
    <Link
      href={href}
      className="mt-auto flex w-full items-center justify-between rounded-md border-[0.5px] bg-white px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--setting-btn-hover)] active:opacity-90 min-[900px]:py-2"
      style={
        {
          borderColor: t.btnBorder,
          color: t.btnText,
          ["--setting-btn-hover" as string]: t.btnHover,
        } as React.CSSProperties
      }
    >
      <span>{children}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  );
}

function FeatureFooterBtn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`mt-auto flex w-full items-center justify-between rounded-md border-[0.5px] bg-white px-3 py-1.5 text-[11px] font-medium transition-colors min-[900px]:py-2 ${className ?? ""}`}
    >
      <span>{children}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </span>
  );
}

function CardSkeleton() {
  return <div className="h-[132px] animate-pulse rounded-lg bg-[#e8e6e0]"/>;
}

function CardDesc({ tone, children }: { tone: SectionTone; children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] leading-relaxed min-[900px]:text-[11px]" style={{ color: SECTION_TONES[tone].desc }}>
      {children}
    </p>
  );
}

// ── main page ──────────────────────────────────────────────────────────

export default function OrganizerSettingsPage() {
  const { user } = useSupabaseUser();

  const [organizer, setOrganizer] = useState<{
    organization_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  } | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const [billing, setBilling] = useState<OrganizerBillingData | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !user?.id) { setOrgLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("organizers")
          .select("organization_name, contact_email, contact_phone")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!cancelled) setOrganizer(data ?? null);
      } catch {
        if (!cancelled) setOrganizer(null);
      } finally {
        if (!cancelled) setOrgLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/billing");
        const json = await res.json();
        if (res.ok && !cancelled) setBilling(json);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayEmail = user?.email ?? "—";
  const displayName =
    (user?.user_metadata?.display_name as string) ??
    (user?.user_metadata?.name as string) ??
    user?.email?.split("@")[0] ??
    "—";

  const planLabel = billing ? getPlanLabel(billing) : "—";
  const slots = billing ? getSlotsLabel(billing) : "—";
  const receiving = billing ? getReceivingStatus(billing) : null;

  const contactVal = organizer
    ? ([organizer.contact_email, organizer.contact_phone].filter(Boolean).join(" / ") || "未設定")
    : "—";

  return (
    <OrganizerPageShell variant="hero" contentClassName="space-y-1.5 pb-16 min-[900px]:space-y-2.5 min-[900px]:pb-0">
      <OrganizerHeroBleed>
        <OrganizerSettingsHeroBanner />
      </OrganizerHeroBleed>

      <OrganizerSettingsMobileView
        planLabel={planLabel}
        slots={slots}
        receiving={receiving}
        displayEmail={displayEmail}
        displayName={displayName}
        organizationName={organizer?.organization_name ?? ""}
        contactVal={contactVal}
        orgLoading={orgLoading}
        billingLoading={billingLoading}
      />

      {/* PC: 行ごとに左右を揃えるフラット2列グリッド */}
      <div className={`hidden min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-stretch ${CARD_GAP}`}>
        {/* 行1: プラン | 売上受取 */}
        {billingLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Link
              href="/organizer/settings/plan"
              className="flex flex-col overflow-hidden rounded-lg border border-[#d4b85a] bg-gradient-to-b from-[#FFF5E0] via-[#FFFCF5] to-white shadow-[0_2px_10px_rgba(200,168,75,0.14)] transition-shadow hover:shadow-[0_4px_16px_rgba(200,168,75,0.22)]"
            >
              <div className="flex items-center gap-1.5 border-b border-[#E8D9A8] bg-[#F5E6B8] px-3 py-1.5 min-[900px]:py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c8a84b]/25">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A5800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 19h16"/>
                    <path d="M6 19l1.5-8 3 3 3.5-7 3.5 7 3-3L18 19"/>
                  </svg>
                </span>
                <span className="text-[11px] font-[600] text-[#6B4E10]">主催者プラン（公開枠）</span>
              </div>
              <div className="flex flex-1 flex-col p-2.5 min-[900px]:p-3">
                <CardDesc tone="plan">
                  現在のプランと公開枠を確認し、変更やお支払いに進めます。
                </CardDesc>
                <div className="mb-2 flex flex-col overflow-hidden rounded-md border border-[#E8D9A8] bg-[#FFFBF0]">
                  <div className="flex items-center justify-between border-b border-[#F0E4C8] bg-[#FFF8EC] px-2.5 py-1.5 min-[900px]:py-[7px]">
                    <span className="text-[10px] font-medium text-[#9a7b20]">現在</span>
                    <span className="text-[11px] font-[600] text-[#5a4020] min-[900px]:text-[12px]">{planLabel}</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 min-[900px]:py-[7px]">
                    <span className="text-[10px] font-medium text-[#9a7b20]">公開枠</span>
                    <span className="text-[11px] font-[600] text-[#4A9A2E] min-[900px]:text-[12px]">{slots}</span>
                  </div>
                </div>
                <FeatureFooterBtn className="border-[#E8D9A8] text-[#7A5800] hover:bg-[#FFF8EC]">
                  確認する
                </FeatureFooterBtn>
              </div>
            </Link>

            <Link
              href="/organizer/settings/payouts"
              className="flex flex-col overflow-hidden rounded-lg border border-[#E8A8C4] bg-gradient-to-b from-[#FDF0F4] via-[#FFFAFC] to-white shadow-[0_2px_10px_rgba(232,112,138,0.12)] transition-shadow hover:shadow-[0_4px_16px_rgba(232,112,138,0.2)]"
            >
              <div className="flex items-center gap-1.5 border-b border-[#F0C4D4] bg-[#FADCE6] px-3 py-1.5 min-[900px]:py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8708A]/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b84060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                </span>
                <span className="text-[11px] font-[600] text-[#9a3050]">売上受取設定</span>
              </div>
              <div className="flex flex-1 flex-col p-2.5 min-[900px]:p-3">
                <CardDesc tone="payout">
                  Stripeで売上を受け取る連携です。料金プランとは別の設定です。
                </CardDesc>
                <div className="mb-2 flex items-center justify-between rounded-md border border-[#F0C4D4] bg-[#FEF6F8] px-2.5 py-1.5 min-[900px]:py-[7px]">
                  <span className="text-[10px] font-medium text-[#c04060]">状態</span>
                  {receiving === "設定済み" ? (
                    <span className="rounded-md border border-[#B8DEB0] bg-[#EAF6DE] px-1.5 py-px text-[10px] font-[600] text-[#3a7a10]">
                      設定済み
                    </span>
                  ) : (
                    <span className="rounded-md border border-[#E8C878] bg-[#FFF3CD] px-1.5 py-px text-[10px] font-[600] text-[#7A5800]">
                      {receiving ?? "未設定"}
                    </span>
                  )}
                </div>
                <FeatureFooterBtn className="border-[#F0C4D4] text-[#2B3A6B] hover:bg-[#FEF0F3]">
                  開く
                </FeatureFooterBtn>
              </div>
            </Link>
          </>
        )}

        {/* 行2: アカウント | 公開情報＋通知 */}
        <SectionCard
          tone="account"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke={SECTION_TONES.account.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
          title="アカウント情報"
        >
          <CardDesc tone="account">ログイン中のアカウントや表示名を管理します</CardDesc>
          <InfoRows
            tone="account"
            rows={[
              { label: "ログイン中", value: displayEmail },
              { label: "表示名", value: displayName || "未設定" },
            ]}
          />
          <SettingBtn tone="account" href="/profile/edit">プロフィールを編集</SettingBtn>
        </SectionCard>

        <div className={`flex h-full flex-col ${CARD_GAP}`}>
          <SectionCard
            tone="display"
            className="flex-1"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke={SECTION_TONES.display.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            }
            title="公開情報 / 表示設定"
          >
            <CardDesc tone="display">主催者ページやイベントでの表示設定（準備中）</CardDesc>
          </SectionCard>

          <div
            className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg border-[0.5px] bg-white px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] min-[900px]:py-2.5"
            style={{ borderColor: SECTION_TONES.account.border }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FB]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7BADC4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-[500] text-[#1a1a1a]">
                通知設定
                <span className="ml-1.5 rounded-md border-[0.5px] border-[#c8a84b] px-1.5 py-px text-[9px] font-medium" style={{ background: "#FFF3CD", color: "#7A5800" }}>
                  準備中
                </span>
              </p>
              <p className="mt-px text-[10px] text-[#888]">お知らせの受け取り方を設定できます</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        {/* 行3: 主催者プロフィール | セキュリティ */}
        <SectionCard
          tone="organizer"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke={SECTION_TONES.organizer.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2"/>
            </svg>
          }
          title="主催者プロフィール"
        >
          <CardDesc tone="organizer">イベント参加者に表示される主催者・団体情報です</CardDesc>
          {orgLoading ? (
            <p className="mb-2 text-[12px] text-[#888]">読み込み中...</p>
          ) : (
            <InfoRows
              tone="organizer"
              rows={[
                { label: "団体名 / 主催者名", value: organizer?.organization_name || "未設定" },
                { label: "問い合わせ先", value: contactVal },
              ]}
            />
          )}
          <SettingBtn tone="organizer" href="/organizer/settings/profile">主催者プロフィールを編集</SettingBtn>
        </SectionCard>

        <SectionCard
          tone="security"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke={SECTION_TONES.security.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
          title="セキュリティ / ログアウト"
        >
          <CardDesc tone="security">
            ログアウトは右上のアカウントメニューから行えます。プロフィールやパスワードの変更はアカウント設定で行えます。
          </CardDesc>
          <SettingBtn tone="security" href="/profile/edit">アカウント設定を開く</SettingBtn>
        </SectionCard>
      </div>
    </OrganizerPageShell>
  );
}
