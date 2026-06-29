"use client";

import { PREFECTURES } from "@/lib/prefectures";
import { VOLUNTEER_DISCOVER_CATEGORIES } from "@/lib/volunteer-discover-categories";
import { VOLUNTEER_ROLE_LABELS } from "@/lib/volunteer-roles-mock";
import {
  getVolunteerDiscoverCategoryLabel,
} from "@/lib/volunteer-discover-categories";
import type { BenefitFilter } from "@/lib/volunteer-utils";

export type MobileVolunteerFilterKind = "area" | "category" | "date" | "benefit";

const DATE_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
] as const;

const BENEFIT_OPTIONS: { value: BenefitFilter | ""; label: string }[] = [
  { value: "", label: "すべて" },
  { value: "TRANSPORT", label: "交通費あり" },
  { value: "MEAL", label: "食事あり" },
  { value: "LODGING", label: "宿泊あり" },
  { value: "REWARD", label: "謝礼あり" },
  { value: "INSURANCE", label: "保険あり" },
  { value: "SHUTTLE", label: "送迎あり" },
];

const ROLE_OPTIONS = Object.entries(VOLUNTEER_ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const TITLES: Record<MobileVolunteerFilterKind, string> = {
  area: "エリアを選択",
  category: "カテゴリを選択",
  date: "活動日を選択",
  benefit: "こだわり条件",
};

type Props = {
  kind: MobileVolunteerFilterKind | null;
  prefecture: string;
  roleType: string;
  dateFilter: string;
  benefitFilter: BenefitFilter | "";
  onClose: () => void;
  onSelectPrefecture: (value: string) => void;
  onSelectRoleType: (value: string) => void;
  onSelectDateFilter: (value: string) => void;
  onSelectBenefitFilter: (value: BenefitFilter | "") => void;
};

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[44px] w-full items-center justify-between rounded-[10px] border px-3.5 text-left text-[13px] transition ${
        selected
          ? "border-[#2D7A4F] bg-[#EAF4ED] font-medium text-[#2D7A4F]"
          : "border-[#DDE8DF] bg-white text-[#1A2214] active:bg-[#f4f8f5]"
      }`}
    >
      {label}
      {selected && <span aria-hidden>✓</span>}
    </button>
  );
}

export function MobileVolunteerFilterSheet({
  kind,
  prefecture,
  roleType,
  dateFilter,
  benefitFilter,
  onClose,
  onSelectPrefecture,
  onSelectRoleType,
  onSelectDateFilter,
  onSelectBenefitFilter,
}: Props) {
  if (!kind) return null;

  const handleSelect = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label={TITLES[kind]}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-hidden rounded-t-2xl border-t border-[#DDE8DF] bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#EAF4ED] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[#1A2214]">{TITLES[kind]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDE8DF] bg-white text-[#566358]"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[60dvh] space-y-2 overflow-y-auto px-4 py-3">
          {kind === "area" && (
            <>
              <OptionButton
                label="すべて"
                selected={!prefecture}
                onClick={() => handleSelect(() => onSelectPrefecture(""))}
              />
              {PREFECTURES.map((p) => (
                <OptionButton
                  key={p}
                  label={p}
                  selected={prefecture === p}
                  onClick={() => handleSelect(() => onSelectPrefecture(p))}
                />
              ))}
            </>
          )}

          {kind === "category" && (
            <>
              <OptionButton
                label="すべて"
                selected={!roleType}
                onClick={() => handleSelect(() => onSelectRoleType(""))}
              />
              {VOLUNTEER_DISCOVER_CATEGORIES.map(({ id, label }) => (
                <OptionButton
                  key={id}
                  label={label}
                  selected={roleType === id}
                  onClick={() => handleSelect(() => onSelectRoleType(id))}
                />
              ))}
              <p className="pt-2 text-[10px] font-medium text-[#8a9088]">役割で絞る</p>
              {ROLE_OPTIONS.map(({ value, label }) => (
                <OptionButton
                  key={value}
                  label={label}
                  selected={roleType === value}
                  onClick={() => handleSelect(() => onSelectRoleType(value))}
                />
              ))}
            </>
          )}

          {kind === "date" &&
            DATE_OPTIONS.map(({ value, label }) => (
              <OptionButton
                key={value || "all"}
                label={label}
                selected={dateFilter === value}
                onClick={() => handleSelect(() => onSelectDateFilter(value))}
              />
            ))}

          {kind === "benefit" &&
            BENEFIT_OPTIONS.map(({ value, label }) => (
              <OptionButton
                key={value || "all"}
                label={label}
                selected={benefitFilter === value}
                onClick={() => handleSelect(() => onSelectBenefitFilter(value))}
              />
            ))}
        </div>
      </div>
    </>
  );
}

export function getMobileFilterButtonLabel(
  kind: MobileVolunteerFilterKind,
  {
    prefecture,
    roleType,
    dateFilter,
    benefitFilter,
  }: {
    prefecture: string;
    roleType: string;
    dateFilter: string;
    benefitFilter: BenefitFilter | "";
  }
): string {
  switch (kind) {
    case "area":
      return prefecture || "エリア";
    case "category":
      if (!roleType) return "カテゴリ";
      return (
        getVolunteerDiscoverCategoryLabel(roleType) !== roleType
          ? getVolunteerDiscoverCategoryLabel(roleType)
          : VOLUNTEER_ROLE_LABELS[roleType as keyof typeof VOLUNTEER_ROLE_LABELS]
      ) || "カテゴリ";
    case "date":
      return DATE_OPTIONS.find((o) => o.value === dateFilter)?.label === "すべて"
        ? "活動日"
        : DATE_OPTIONS.find((o) => o.value === dateFilter)?.label ?? "活動日";
    case "benefit": {
      if (!benefitFilter) return "こだわり";
      const opt = BENEFIT_OPTIONS.find((o) => o.value === benefitFilter);
      return opt?.label.replace("あり", "") ?? "こだわり";
    }
    default:
      return "";
  }
}

export function isMobileFilterActive(
  kind: MobileVolunteerFilterKind,
  {
    prefecture,
    roleType,
    dateFilter,
    benefitFilter,
  }: {
    prefecture: string;
    roleType: string;
    dateFilter: string;
    benefitFilter: BenefitFilter | "";
  }
): boolean {
  switch (kind) {
    case "area":
      return Boolean(prefecture);
    case "category":
      return Boolean(roleType);
    case "date":
      return Boolean(dateFilter);
    case "benefit":
      return Boolean(benefitFilter);
    default:
      return false;
  }
}
