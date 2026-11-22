"use client";

import { useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrganizerGameType, type OrganizerGameTypeId } from "@/lib/organizer/game-types";
import {
  GAME_PURPOSES,
  GAME_TYPE_MASCOT,
  isGamePurposeId,
  setLiveGameBasics,
  stashGameBasicsForSwitch,
  takeCarriedGameBasics,
} from "@/components/organizer/games/game-purposes";

/**
 * 「やりたいこと」から作成に入ったとき、基本の手順のいちばん上に出す「遊び方」の切りかえ。
 * 変えても、入れたゲーム名と説明は持ちこす（それより後の手順の中身は、遊び方ごとに作り直す）。
 */
export function GamePlayStyleSwitch() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/organizer/games/new";
  const purposeRaw = params.get("purpose");
  const type = params.get("type");
  if (params.get("edit") || !isGamePurposeId(purposeRaw)) return null;
  const purpose = GAME_PURPOSES.find((p) => p.id === purposeRaw);
  if (!purpose || purpose.types.length < 2) return null;

  return (
    <section className="mb-3 rounded-[18px] border border-[#e6e2d6] bg-white p-3.5 shadow-[0_1px_4px_rgba(23,63,44,0.05)]" aria-label="遊び方">
      <p className="mb-2 text-[12px] font-bold text-[#a3812f]">{purpose.label}・遊び方を選ぶ</p>
      <ul className="grid grid-cols-2 gap-1.5 min-[900px]:grid-cols-3">
        {purpose.types.map((id: OrganizerGameTypeId) => {
          const t = getOrganizerGameType(id);
          const on = id === type;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => {
                  if (on) return;
                  stashGameBasicsForSwitch();
                  router.replace(`${pathname}?type=${id}&purpose=${purpose.id}`, { scroll: false });
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[14px] border px-2 py-1.5 text-left transition",
                  on ? "border-[#2f7d4e] bg-[#eef7f1]" : "border-[#e6e2d6] bg-white hover:border-[#c9a54e]"
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f6f1]" aria-hidden>
                  <Image src={GAME_TYPE_MASCOT[id] ?? "/organizer/games/hub-mascot.png"} alt="" width={36} height={36} unoptimized />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-[#163828]">{t.label}</span>
                  <span className="block truncate text-[11px] text-[#5f6d64] max-[599px]:hidden">{t.description}</span>
                </span>
                {on ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f7d4e] text-white max-[599px]:hidden" aria-hidden>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-[#6b776f]">変えても、入れたゲーム名と説明はそのまま残ります。</p>
    </section>
  );
}

/** 各ゲームの作成画面で使う：入れているゲーム名と説明を覚え、遊び方を変えてきたときは引き継ぐ */
export function useGameBasicsCarry(
  name: string,
  description: string,
  setName: (value: string) => void,
  setDescription: (value: string) => void
) {
  useEffect(() => {
    const carried = takeCarriedGameBasics();
    if (!carried) return;
    if (carried.name) setName(carried.name);
    if (carried.description) setDescription(carried.description);
    // 最初に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setLiveGameBasics(name, description);
  }, [name, description]);
}
