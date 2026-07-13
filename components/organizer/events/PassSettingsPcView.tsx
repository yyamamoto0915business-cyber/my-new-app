"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Check,
  CreditCard,
  ExternalLink,
  FileUser,
  QrCode,
  UserCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applicationTypeFromParticipationMode,
  applicationTypeLabel,
  checkInMethodLabel,
  formatPassCapacity,
  formatPassDeadline,
  formatPassPrice,
  normalizePassSettingsForSave,
  participationModeFromApplicationType,
  paymentMethodLabel,
  validatePassSettings,
  type EventPassCheckInMethod,
  type EventPassPaymentMethod,
  type EventPassSettings,
} from "@/lib/event-pass-settings";
import type { EventFormData } from "@/lib/events";

type Props = {
  form: EventFormData;
  onSave: (next: {
    participationMode: "required" | "none";
    paymentMethod: EventPassSettings["paymentMethod"];
    checkInMethod: EventPassSettings["checkInMethod"];
    passConfigured: true;
    requiresRegistration: boolean;
  }) => void;
  onCancel: () => void;
  onEditEventInfo: () => void;
};

function OptionCard({
  selected,
  title,
  description,
  icon,
  onSelect,
  className,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition",
        selected
          ? "border-[#348b38] bg-[#f3faf0] shadow-[0_1px_0_rgba(52,139,56,0.08)]"
          : "border-[#e4e2dc] bg-white hover:border-[#cfe5c8]",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]",
          selected ? "bg-[#e7f5e1] text-[#2d7a32]" : "bg-[#f3f2ef] text-[#6b6963]"
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 pr-5">
        <span className="block text-[12px] font-semibold leading-snug text-[#1a1a1a]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-[1.45] text-[#7a7872]">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "absolute right-2.5 top-2.5 flex h-[16px] w-[16px] items-center justify-center rounded-full border",
          selected ? "border-[#348b38] bg-[#348b38] text-white" : "border-[#cfcbc3] bg-white"
        )}
        aria-hidden
      >
        {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

function PreviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f0eee9] py-1.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#7a7872]">
        <span className="text-[#9a978f]" aria-hidden>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <span
        className={cn(
          "shrink-0 text-right text-[11px] font-medium",
          value === "未設定" ? "text-[#b0ada6]" : "text-[#1a1a1a]"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PassSettingsPcView({
  form,
  onSave,
  onCancel,
  onEditEventInfo,
}: Props) {
  const [applicationType, setApplicationType] = useState<EventPassSettings["applicationType"]>(
    () => applicationTypeFromParticipationMode(form.participationMode)
  );
  const [paymentMethod, setPaymentMethod] = useState<EventPassSettings["paymentMethod"]>(
    () => form.paymentMethod ?? (form.price >= 1 ? "onsite" : null)
  );
  const [checkInMethod, setCheckInMethod] = useState<EventPassSettings["checkInMethod"]>(
    () => form.checkInMethod ?? (applicationTypeFromParticipationMode(form.participationMode) === "required" ? "qr" : null)
  );
  const [errors, setErrors] = useState<
    Partial<Record<"applicationType" | "paymentMethod" | "checkInMethod", string>>
  >({});
  const [stripeWarning, setStripeWarning] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/organizer/billing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const charges = Boolean(d.organizer?.stripe_account_charges_enabled);
        setStripeReady(charges);
        setStripeLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setStripeLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const price = form.price ?? 0;
  const showPayment = applicationType === "required" && price >= 1;
  const showCheckIn = applicationType === "required";
  const showStripeNotice =
    showPayment && (paymentMethod === "online" || paymentMethod === "both");

  const previewPayment =
    applicationType === "none"
      ? "—"
      : price <= 0
        ? "無料のため不要"
        : paymentMethodLabel(paymentMethod);

  const previewCheckIn =
    applicationType === "none"
      ? checkInMethod
        ? `${checkInMethodLabel(checkInMethod)}（簡易受付）`
        : "—"
      : checkInMethodLabel(checkInMethod);

  const handleSave = () => {
    const raw: EventPassSettings = {
      applicationType,
      paymentMethod: showPayment ? paymentMethod : null,
      checkInMethod: showCheckIn || applicationType === "none" ? checkInMethod : null,
    };
    const normalized = normalizePassSettingsForSave(raw, price);
    const result = validatePassSettings(normalized, price, stripeReady);
    setErrors(result.errors);
    setStripeWarning(result.stripeWarning);
    if (!result.ok) return;

    const participationMode = participationModeFromApplicationType(normalized.applicationType);
    onSave({
      participationMode,
      paymentMethod: normalized.paymentMethod,
      checkInMethod: normalized.checkInMethod,
      passConfigured: true,
      requiresRegistration: participationMode === "required",
    });
  };

  return (
    <div className="hidden min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-hidden">
      {/* 左メイン */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-[#e8e6e0]">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="mb-2.5 flex items-center gap-1 text-[11px] font-medium text-[#5c5a54] hover:text-[#2d7a32]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            詳細情報に戻る
          </button>

          <div className="mb-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#1a1a1a]">
              参加パス設定
            </h2>
            <p className="mt-0.5 text-[12px] leading-snug text-[#6b6963]">
              申込フローと受付方法を設定します。参加費・定員・締切は他画面の設定を反映します。
            </p>
          </div>

          {/* 反映済み情報 */}
          <section className="mb-3.5 rounded-[10px] border border-[#d7ebcf] bg-[#f4faf1] px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-semibold text-[#1a5c22]">
                  反映中
                </span>
                {[
                  { label: "参加費", value: formatPassPrice(price) },
                  {
                    label: "定員",
                    value: formatPassCapacity(form.capacity ?? null),
                  },
                  {
                    label: "締切",
                    value: formatPassDeadline(form.registrationDeadline ?? null),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="inline-flex items-center gap-1 rounded-[6px] border border-[#dcead5] bg-white px-2 py-1 text-[11px] text-[#3d4f38]"
                  >
                    <span className="text-[#6b7d64]">{item.label}</span>
                    <span className="font-semibold text-[#1a1a1a]">{item.value}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onEditEventInfo}
                className="inline-flex shrink-0 items-center gap-1 rounded-[7px] border border-[#cfe5c8] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#2d7a32] hover:bg-[#fafaf8]"
              >
                開催情報を編集
                <ExternalLink className="h-3 w-3" strokeWidth={2.2} />
              </button>
            </div>
          </section>

          {/* 1. 申込方法 */}
          <section className="mb-3.5">
            <h3 className="mb-1.5 text-[13px] font-semibold text-[#1a1a1a]">
              1. 申込方法を選ぶ
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <OptionCard
                selected={applicationType === "none"}
                title="申込不要で開催する"
                description="自由参加。参加パスは発行されません。"
                icon={<Ban className="h-3.5 w-3.5" strokeWidth={2} />}
                onSelect={() => {
                  setApplicationType("none");
                  setPaymentMethod(null);
                  setErrors({});
                }}
              />
              <OptionCard
                selected={applicationType === "required"}
                title="参加申込みを受け付ける"
                description="申込後に参加パスを発行します。"
                icon={<FileUser className="h-3.5 w-3.5" strokeWidth={2} />}
                onSelect={() => {
                  setApplicationType("required");
                  if (price >= 1 && !paymentMethod) setPaymentMethod("onsite");
                  if (!checkInMethod) setCheckInMethod("qr");
                  setErrors({});
                }}
              />
            </div>
          </section>

          {/* 2. 支払い方法 */}
          {applicationType === "required" && (
            <section className="mb-3.5">
              <h3 className="mb-1.5 text-[13px] font-semibold text-[#1a1a1a]">
                2. 支払い方法
              </h3>
              {price < 1 ? (
                <p className="rounded-[8px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2 text-[11px] leading-snug text-[#6b6963]">
                  参加費は無料のため、支払い方法の設定は不要です。
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: "online" as EventPassPaymentMethod,
                          title: "オンライン事前決済",
                          description: "申込時にカードなどで支払い",
                          icon: <CreditCard className="h-3.5 w-3.5" strokeWidth={2} />,
                        },
                        {
                          id: "onsite" as EventPassPaymentMethod,
                          title: "現地で支払い",
                          description: "当日会場で支払い",
                          icon: <Wallet className="h-3.5 w-3.5" strokeWidth={2} />,
                        },
                        {
                          id: "both" as EventPassPaymentMethod,
                          title: "オンライン・現地どちらも",
                          description: "参加者が選択できます",
                          icon: (
                            <span className="flex items-center gap-0.5">
                              <CreditCard className="h-3 w-3" strokeWidth={2} />
                              <Wallet className="h-3 w-3" strokeWidth={2} />
                            </span>
                          ),
                        },
                      ] as const
                    ).map((opt) => (
                      <OptionCard
                        key={opt.id}
                        selected={paymentMethod === opt.id}
                        title={opt.title}
                        description={opt.description}
                        icon={opt.icon}
                        onSelect={() => {
                          setPaymentMethod(opt.id);
                          setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                        }}
                      />
                    ))}
                  </div>
                  {errors.paymentMethod ? (
                    <p className="mt-1.5 text-[11px] text-[#E8708A]">{errors.paymentMethod}</p>
                  ) : null}
                </>
              )}
            </section>
          )}

          {/* オンライン決済案内（左カラムにも警告） */}
          {showStripeNotice && (
            <section className="mb-3.5 rounded-[10px] border border-[#f0d7b8] bg-[#fff8ef] px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[#9A4E0E]">
                    オンライン決済の設定
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#8a5a28]">
                    利用には支払い設定が必要です。保存はできますが、公開前に完了してください。
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      stripeReady
                        ? "bg-[#EAF6DE] text-[#2d7a32]"
                        : "bg-[#FFF4E8] text-[#C26A1A]"
                    )}
                  >
                    {stripeLoaded
                      ? stripeReady
                        ? "設定済み"
                        : "設定が必要です"
                      : "確認中…"}
                  </span>
                  <Link
                    href="/organizer/settings/payouts"
                    className="inline-flex items-center rounded-[7px] border border-[#D4893A] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#C26A1A] hover:bg-[#fffaf5]"
                  >
                    支払い設定を確認
                  </Link>
                </div>
              </div>
              {stripeWarning ? (
                <p className="mt-1.5 text-[11px] leading-snug text-[#9A4E0E]">
                  有料イベント公開前に Stripe 設定を完了してください。
                </p>
              ) : null}
            </section>
          )}

          {/* 3. 受付方法 */}
          {showCheckIn ? (
            <section className="mb-2">
              <h3 className="mb-1.5 text-[13px] font-semibold text-[#1a1a1a]">
                3. 当日の受付方法
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: "qr" as EventPassCheckInMethod,
                      title: "QRコードで受付",
                      description: "参加パスのQRを読み取って受付",
                      icon: <QrCode className="h-3.5 w-3.5" strokeWidth={2} />,
                    },
                    {
                      id: "manual" as EventPassCheckInMethod,
                      title: "主催者が手動で受付",
                      description: "参加者一覧から手動で受付",
                      icon: <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />,
                    },
                  ] as const
                ).map((opt) => (
                  <OptionCard
                    key={opt.id}
                    selected={checkInMethod === opt.id}
                    title={opt.title}
                    description={opt.description}
                    icon={opt.icon}
                    onSelect={() => {
                      setCheckInMethod(opt.id);
                      setErrors((prev) => ({ ...prev, checkInMethod: undefined }));
                    }}
                  />
                ))}
              </div>
              {errors.checkInMethod ? (
                <p className="mt-1.5 text-[11px] text-[#E8708A]">{errors.checkInMethod}</p>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#eeebe5] bg-white px-5 py-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-[9px] bg-[#2d7a32] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#256a2a]"
          >
            設定内容を保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[9px] border border-[#d0ccc4] bg-white px-4 py-2 text-[12px] font-medium text-[#4a4844] hover:bg-[#fafaf8]"
          >
            キャンセル
          </button>
        </div>
      </div>

      {/* 右サイド */}
      <aside className="hidden w-[280px] shrink-0 overflow-y-auto bg-[#fafaf8] px-3.5 py-3.5 min-[1100px]:block xl:w-[300px]">
        <div className="sticky top-0 space-y-2.5">
          <div className="rounded-[10px] border border-[#e8e6e0] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <h3 className="mb-0.5 text-[12px] font-semibold text-[#1a1a1a]">
              設定のプレビュー
            </h3>
            <div>
              <PreviewRow
                icon={<FileUser className="h-3 w-3" strokeWidth={2} />}
                label="申込方法"
                value={applicationTypeLabel(applicationType)}
              />
              <PreviewRow
                icon={<Wallet className="h-3 w-3" strokeWidth={2} />}
                label="参加費"
                value={formatPassPrice(price)}
              />
              <PreviewRow
                icon={<CreditCard className="h-3 w-3" strokeWidth={2} />}
                label="支払い方法"
                value={previewPayment}
              />
              <PreviewRow
                icon={<UserCheck className="h-3 w-3" strokeWidth={2} />}
                label="定員"
                value={formatPassCapacity(form.capacity ?? null)}
              />
              <PreviewRow
                icon={<Ban className="h-3 w-3" strokeWidth={2} />}
                label="申込締切"
                value={formatPassDeadline(form.registrationDeadline ?? null)}
              />
              <PreviewRow
                icon={<QrCode className="h-3 w-3" strokeWidth={2} />}
                label="当日の受付"
                value={previewCheckIn}
              />
            </div>
          </div>

          {showStripeNotice ? (
            <div className="rounded-[10px] border border-[#f0d7b8] bg-[#fff8ef] px-3 py-2.5">
              <p className="text-[11px] font-semibold text-[#9A4E0E]">オンライン決済</p>
              <p className="mt-0.5 text-[10px] leading-snug text-[#8a5a28]">
                公開前に支払い設定の完了が必要です。
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    stripeReady
                      ? "bg-[#EAF6DE] text-[#2d7a32]"
                      : "bg-white text-[#C26A1A]"
                  )}
                >
                  {stripeReady ? "設定済み" : "設定が必要です"}
                </span>
                <Link
                  href="/organizer/settings/payouts"
                  className="text-[10px] font-semibold text-[#C26A1A] underline-offset-2 hover:underline"
                >
                  支払い設定を確認する
                </Link>
              </div>
            </div>
          ) : null}

          <div className="rounded-[10px] border border-[#d7ebcf] bg-[#f4faf1] px-3 py-2.5">
            <h3 className="text-[12px] font-semibold text-[#1a5c22]">参加パスについて</h3>
            <p className="mt-1 text-[10px] leading-[1.55] text-[#5f7a58]">
              無料でも入場管理のためにパスを発行できます。申込後、QR付きパスが届きます。
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
