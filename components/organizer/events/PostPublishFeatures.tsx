"use client";

import { useEffect, useState } from "react";
import { Users, QrCode, CreditCard } from "lucide-react";
import {
  FeatureSettingCard,
  type FeatureSettingStatus,
} from "@/components/organizer/events/FeatureSettingCard";
import {
  applicationTypeFromParticipationMode,
  buildPassSettingSummaryLines,
} from "@/lib/event-pass-settings";

type PassFormSlice = {
  price: number;
  capacity?: number | null;
  registrationDeadline?: string | null;
  participationMode?: "required" | "optional" | "none" | null;
  paymentMethod?: "online" | "onsite" | "both" | null;
  checkInMethod?: "qr" | "manual" | null;
  passConfigured?: boolean;
};

/** 参加パス設定の補助ステータス */
function resolvePassStatus(form: PassFormSlice): FeatureSettingStatus {
  if (form.passConfigured) {
    if (form.price > 0) return "有料";
    return "設定済み";
  }
  if (form.price > 0) return "有料";

  const hasPassConfig =
    form.capacity != null ||
    Boolean(form.registrationDeadline) ||
    form.participationMode === "required";

  if (form.participationMode === "none") return "未設定";
  if (hasPassConfig) return "設定済み";
  return "未設定";
}

/** Stripe / 振込先設定の補助ステータス */
function resolvePayoutStatus(organizer: {
  stripe_account_charges_enabled?: boolean;
  stripe_account_details_submitted?: boolean;
  stripe_status?: string | null;
} | null): FeatureSettingStatus {
  if (!organizer) return "未設定";
  const charges = Boolean(organizer.stripe_account_charges_enabled);
  const submitted = Boolean(organizer.stripe_account_details_submitted);
  const status = (organizer.stripe_status ?? "").toLowerCase();

  if (status === "rejected" || status === "restricted" || status === "error") {
    return "要確認";
  }
  if (charges) return "設定済み";
  if (submitted) return "確認中";
  return "未設定";
}

/**
 * PC版イベント作成 STEP3 中央カラム
 * 「公開後に設定できること」— スタッフ / 参加パス / 決済の3カードのみ
 */
export function PostPublishFeatures({
  form,
  onOpenPassSettings,
  features = ["staff", "pass", "payout"],
}: {
  eventId?: string;
  form: PassFormSlice;
  onOpenPassSettings?: () => void;
  features?: Array<"staff" | "pass" | "payout">;
}) {
  const [payoutStatus, setPayoutStatus] =
    useState<FeatureSettingStatus>("未設定");

  const featureKey = features.join(",");

  useEffect(() => {
    if (!featureKey.includes("payout")) return;
    let cancelled = false;
    fetch("/api/organizer/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setPayoutStatus(resolvePayoutStatus(d.organizer ?? null));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  const passStatus = resolvePassStatus(form);
  const applicationType = applicationTypeFromParticipationMode(form.participationMode);
  const summaryLines = buildPassSettingSummaryLines({
    passConfigured: form.passConfigured,
    applicationType,
    paymentMethod: form.paymentMethod ?? null,
    checkInMethod: form.checkInMethod ?? null,
    price: form.price,
  });

  const openPass = () => {
    if (onOpenPassSettings) {
      onOpenPassSettings();
      return;
    }
    const el = document.getElementById("event-form-pass-fields");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-3">
      {features.includes("staff") ? (
        <FeatureSettingCard
          accent="blue"
          title="スタッフを募集する"
          description="受付・誘導・設営など役割ごとにスタッフを募集できます。公開後にスタッフ募集ページから設定できます。"
          buttonLabel="スタッフ募集ページへ"
          href="/organizer/recruitments"
          icon={<Users className="h-4 w-4" strokeWidth={2} />}
        />
      ) : null}

      {features.includes("pass") ? (
        <FeatureSettingCard
          accent="green"
          emphasized
          title={form.passConfigured ? "参加パス" : "参加パスを設定する"}
          description={
            form.passConfigured
              ? "申込フローと受付方法を確認・変更できます。"
              : "無料・有料の参加受付や、申込後の参加パス発行・当日受付を設定できます。"
          }
          buttonLabel={form.passConfigured ? "参加パスを編集" : "参加パス設定へ"}
          status={passStatus}
          summaryLines={summaryLines}
          onClick={openPass}
          icon={<QrCode className="h-4 w-4" strokeWidth={2} />}
        />
      ) : null}

      {features.includes("payout") ? (
        <FeatureSettingCard
          accent="orange"
          title="クレジット決済・オンライン支払い設定"
          description="有料イベントのクレジット決済やオンライン支払いを受け取るための設定を行います。Stripe連携と売上の振込先口座の登録が必要です。"
          buttonLabel="支払い設定へ"
          status={payoutStatus}
          href="/organizer/settings/payouts"
          icon={<CreditCard className="h-4 w-4" strokeWidth={2} />}
        />
      ) : null}
    </div>
  );
}
