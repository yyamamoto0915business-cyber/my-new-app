"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Plus, Store, Truck, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CreateOption = {
  id: string;
  label: string;
  href?: string;
  comingSoon?: boolean;
  Icon: typeof Calendar;
};

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: "event",
    label: "イベント掲載",
    href: "/organizer/events/new",
    Icon: Calendar,
  },
  {
    id: "store",
    label: "店舗掲載",
    href: "/organizer/stores/new",
    Icon: Store,
  },
  {
    id: "kitchen",
    label: "キッチンカー掲載",
    href: "/organizer/kitchen-cars/new",
    Icon: Truck,
  },
  {
    id: "volunteer",
    label: "スタッフ募集",
    href: "/organizer/recruitments/new",
    Icon: Users,
  },
];

type OrganizerCreateSplitButtonProps = {
  className?: string;
};

/** 「新しく作成する」スプリットボタン（案A: 全体でメニュー開閉） */
export function OrganizerCreateSplitButton({ className }: OrganizerCreateSplitButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "flex w-full items-stretch overflow-hidden bg-[#2D7A4F] text-[12px] font-semibold text-white outline-none transition-colors hover:bg-[#245f3e]",
                "focus-visible:ring-2 focus-visible:ring-[#2D7A4F]/35 focus-visible:ring-offset-2",
                open ? "rounded-t-lg" : "rounded-lg",
              )}
              aria-label="新しく作成する"
            >
              <span className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
                <Plus className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden />
                <span>新しく作成する</span>
              </span>
              <span
                className="flex w-9 shrink-0 items-center justify-center border-l border-white/30"
                aria-hidden
              >
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-150",
                    open && "rotate-180",
                  )}
                  strokeWidth={2.6}
                />
              </span>
            </button>
          }
        />

        <DropdownMenuContent
          align="start"
          sideOffset={0}
          className="z-[70] rounded-t-none rounded-b-lg border-0 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
        >
          {CREATE_OPTIONS.map((option) => {
            const disabled = Boolean(option.comingSoon || !option.href);
            return (
              <DropdownMenuItem
                key={option.id}
                disabled={disabled}
                onClick={() => {
                  if (!option.href) return;
                  setOpen(false);
                  router.push(option.href);
                }}
                className={cn(
                  "min-h-10 cursor-pointer gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[#1a1a1a]",
                  "focus:bg-[#EAF4ED] focus:text-[#1a1a1a]",
                  disabled && "opacity-45",
                )}
              >
                <option.Icon
                  className="size-4 text-[#2D7A4F]"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="flex-1">{option.label}</span>
                {option.comingSoon ? (
                  <span className="text-[10px] font-normal text-[#999]">準備中</span>
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
