"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "./language-provider";
import { getModeFromCookie, setModeCookie, type ModePreference } from "@/lib/mode-preference";

export function ModeSelector() {
  const router = useRouter();
  const { t } = useLanguage();
  const current = getModeFromCookie();

  const labels: Record<NonNullable<ModePreference>, string> = {
    EVENT: t.modeEvent,
    VOLUNTEER: t.modeVolunteer,
    ORGANIZER: t.modeOrganizer,
  };

  const handleChange = (mode: ModePreference) => {
    setModeCookie(mode);
    if (mode === "EVENT") router.push("/events");
    else if (mode === "VOLUNTEER") router.push("/volunteer");
    else if (mode === "ORGANIZER") router.push("/organizer/events");
    else router.push("/events");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
        モード
      </span>
      <select
        value={current ?? "EVENT"}
        onChange={(e) => handleChange((e.target.value as ModePreference) || null)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="EVENT">{labels.EVENT}</option>
        <option value="VOLUNTEER">{labels.VOLUNTEER}</option>
        <option value="ORGANIZER">{labels.ORGANIZER}</option>
      </select>
    </div>
  );
}
