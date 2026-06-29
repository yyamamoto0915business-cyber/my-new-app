"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { MapPin, Crosshair, X, Check } from "lucide-react";
import { PREFECTURES } from "@/lib/prefectures";
import { getCitiesForPrefecture } from "@/lib/cities-by-prefecture";
import {
  getRegionPreference,
  setRegionPreference,
  type RegionPreference,
} from "@/lib/area-preference-storage";
import { reverseGeocodeRegion } from "@/lib/reverse-geocode-region";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
};

const selectClass =
  "w-full appearance-none rounded-lg border border-[#e3e8e4] bg-[#fafaf8] px-2.5 py-1.5 pr-7 text-[12px] text-[#1a2b1c] outline-none transition focus:border-[#4a9a68] focus:bg-white";

const POPOVER_W = 272;

export function RegionSettingModal({ isOpen, onClose, anchorRef }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const titleId = useId();
  const descId = useId();

  const emptyPreference: RegionPreference = { prefecture: "", city: "", setAsHome: true };
  const [draft, setDraft] = useState<RegionPreference>(emptyPreference);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setDraft(getRegionPreference());
      setLocateError(null);
    }
  }, [isOpen]);

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedH = 380;
    let top = rect.top + rect.height / 2 - estimatedH / 2;
    top = Math.max(12, Math.min(top, window.innerHeight - estimatedH - 12));
    setCoords({ left: rect.right + 8, top });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const cities = getCitiesForPrefecture(draft.prefecture);
  const hasCities = cities.length > 0;

  const handlePrefectureChange = (prefecture: string) => {
    const nextCities = getCitiesForPrefecture(prefecture);
    setDraft((prev) => ({
      ...prev,
      prefecture,
      city: nextCities[0] ?? "",
    }));
  };

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocateError("位置情報を利用できません");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const result = await reverseGeocodeRegion(
            pos.coords.latitude,
            pos.coords.longitude
          );
          if (!result) {
            setLocateError("地域を特定できませんでした");
            return;
          }
          const nextCities = getCitiesForPrefecture(result.prefecture);
          const matchedCity =
            nextCities.find((c) => result.city.includes(c) || c.includes(result.city)) ??
            nextCities[0] ??
            result.city;
          setDraft((prev) => ({
            ...prev,
            prefecture: result.prefecture,
            city: matchedCity,
          }));
        } catch {
          setLocateError("取得に失敗しました");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError("位置情報が許可されていません");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  }, []);

  const handleSave = () => {
    if (!draft.prefecture) return;
    setRegionPreference(draft);

    if (draft.setAsHome) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("prefecture", draft.prefecture);
      if (draft.city && draft.city !== "その他") params.set("city", draft.city);
      else params.delete("city");
      const qs = params.toString();
      router.push(pathname + (qs ? `?${qs}` : ""));
    }

    onClose();
  };

  if (!isOpen || !mounted || !coords) return null;

  const currentLabel = draft.prefecture
    ? draft.city && draft.city !== "その他"
      ? `${draft.prefecture} ${draft.city}`
      : draft.prefecture
    : "未設定";

  const panel = (
    <>
      <div
        className="fixed inset-0 z-[199] bg-black/25 min-[900px]:left-20"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="fixed z-[200]"
        style={{ left: coords.left, top: coords.top, width: POPOVER_W }}
      >
        {/* 左向き矢印 */}
        <span
          className="absolute -left-[6px] top-[42%] h-0 w-0 border-y-[7px] border-r-[7px] border-y-transparent border-r-white drop-shadow-[-1px_0_0_#e8ebe6]"
          aria-hidden
        />
        <div className="relative rounded-xl border border-[#e8ebe6] bg-white p-3.5 shadow-[0_8px_24px_rgba(14,22,16,0.1)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-1">
              <h2 id={titleId} className="text-[13px] font-semibold leading-snug text-[#0e1610]">
                あなたのまちを設定
              </h2>
              <p id={descId} className="mt-0.5 text-[10px] leading-relaxed text-[#8a9088]">
                近くのイベントやボランティア募集を優先して表示します
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-0.5 text-[#8a9088] transition hover:bg-[#f4f6f4]"
              aria-label="閉じる"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[#f4faf6] px-2.5 py-2 text-[11px] text-[#3d5c48]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            <span className="min-w-0 truncate">
              現在の設定：
              <span className="ml-0.5 font-semibold text-[#2d7d52]">{currentLabel}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#d8e0dc] bg-white px-2.5 py-2 text-[11px] font-medium text-[#1e3848] transition hover:bg-[#f8faf8] disabled:opacity-60"
          >
            <Crosshair className="h-3.5 w-3.5 text-[#4a9a68]" aria-hidden />
            {locating ? "取得中…" : "現在地から設定する"}
          </button>
          {locateError && (
            <p className="mt-1 text-center text-[10px] text-[#c45c5c]">{locateError}</p>
          )}

          <div className="mt-2.5 space-y-2">
            <div>
              <label
                htmlFor="region-prefecture"
                className="mb-1 block text-[11px] font-medium text-[#3d5c48]"
              >
                都道府県
              </label>
              <div className="relative">
                <select
                  id="region-prefecture"
                  value={draft.prefecture}
                  onChange={(e) => handlePrefectureChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8a9088]"
                  aria-hidden
                >
                  ▾
                </span>
              </div>
            </div>

            {draft.prefecture && (
              <div>
                <label
                  htmlFor="region-city"
                  className="mb-1 block text-[11px] font-medium text-[#3d5c48]"
                >
                  市区町村
                </label>
                {hasCities ? (
                  <div className="relative">
                    <select
                      id="region-city"
                      value={draft.city}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className={selectClass}
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#8a9088]"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </div>
                ) : (
                  <input
                    id="region-city"
                    type="text"
                    value={draft.city}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="市区町村名"
                    className={selectClass}
                  />
                )}
              </div>
            )}
          </div>

          <label className="mt-2.5 flex cursor-pointer items-center gap-2">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                draft.setAsHome
                  ? "border-[#2d7d52] bg-[#2d7d52] text-white"
                  : "border-[#c8dcd0] bg-white"
              }`}
            >
              {draft.setAsHome && (
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              )}
            </span>
            <input
              type="checkbox"
              checked={draft.setAsHome}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, setAsHome: e.target.checked }))
              }
              className="sr-only"
            />
            <span className="text-[11px] text-[#3d5c48]">この地域をホームに設定する</span>
          </label>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#d8e0dc] bg-white px-2 py-2 text-[11px] font-medium text-[#6a7268] transition hover:bg-[#f8faf8]"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.prefecture}
              className="flex-1 rounded-lg bg-[#1e5848] px-2 py-2 text-[11px] font-medium text-white transition hover:bg-[#174a3c] disabled:opacity-50"
            >
              保存する
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
