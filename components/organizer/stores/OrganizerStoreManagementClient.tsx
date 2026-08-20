"use client";

import { useEffect, useState } from "react";
import { OrganizerStoreManagement } from "@/components/organizer/stores/OrganizerStoreManagement";
import type {
  StoreMenuRecord,
  StoreNewsRecord,
  StoreRecord,
  StoreScheduleRecord,
} from "@/lib/stores/types";
import { storeRecordToOrganizerView } from "@/lib/stores/view-model";
import type { StoreLinkedEventView } from "@/lib/stores/store-linked-events";

type Props = {
  storeId: string;
  initialRecord: StoreRecord;
  initialNews: StoreNewsRecord[];
  initialMenu: StoreMenuRecord[];
  initialSchedules?: StoreScheduleRecord[];
};

export function OrganizerStoreManagementClient({
  storeId,
  initialRecord,
  initialNews,
  initialMenu,
  initialSchedules = [],
}: Props) {
  const [record, setRecord] = useState<StoreRecord>(initialRecord);
  const [news, setNews] = useState<StoreNewsRecord[]>(initialNews);
  const [menu, setMenu] = useState<StoreMenuRecord[]>(initialMenu);
  const [schedules, setSchedules] =
    useState<StoreScheduleRecord[]>(initialSchedules);
  const [events, setEvents] = useState<StoreLinkedEventView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isKitchen = record.kind === "kitchen_car";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch(`/api/organizer/stores/${storeId}`, { cache: "no-store" }),
          fetch(`/api/organizer/stores/${storeId}/news`, { cache: "no-store" }),
          fetch(`/api/organizer/stores/${storeId}/menu`, { cache: "no-store" }),
        ];
        if (isKitchen) {
          fetches.push(
            fetch(`/api/organizer/stores/${storeId}/schedules`, {
              cache: "no-store",
            }),
          );
        } else {
          fetches.push(
            fetch(`/api/organizer/stores/${storeId}/events`, {
              cache: "no-store",
            }),
          );
        }

        const [storeRes, newsRes, menuRes, extraRes] = await Promise.all(fetches);

        if (storeRes.ok) {
          const json = (await storeRes.json()) as StoreRecord;
          if (!cancelled) setRecord(json);
        } else if (storeRes.status !== 401) {
          const json = await storeRes.json().catch(() => ({}));
          if (!cancelled) {
            setLoadError(
              json.error ??
                (isKitchen
                  ? "キッチンカーを読み込めませんでした"
                  : "店舗を読み込めませんでした"),
            );
          }
        }

        if (newsRes.ok) {
          const json = (await newsRes.json()) as { news: StoreNewsRecord[] };
          if (!cancelled) setNews(json.news ?? []);
        }

        if (menuRes.ok) {
          const json = (await menuRes.json()) as { menu: StoreMenuRecord[] };
          if (!cancelled) setMenu(json.menu ?? []);
        }

        if (extraRes?.ok) {
          if (isKitchen) {
            const json = (await extraRes.json()) as {
              schedules: StoreScheduleRecord[];
            };
            if (!cancelled) setSchedules(json.schedules ?? []);
          } else {
            const json = (await extraRes.json()) as {
              events: StoreLinkedEventView[];
            };
            if (!cancelled) setEvents(json.events ?? []);
          }
        }
      } catch {
        // 初期表示を維持
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, isKitchen]);

  return (
    <>
      {loadError ? (
        <p className="mb-2 rounded-lg bg-[#FFF5EE] px-3 py-2 text-[12px] text-[#C45C12]">
          {loadError}（表示中はローカルの初期データです）
        </p>
      ) : null}
      <OrganizerStoreManagement
        record={record}
        view={storeRecordToOrganizerView(record, news, events)}
        newsRecords={news}
        menuRecords={menu}
        scheduleRecords={schedules}
        linkedEvents={events}
        onRecordChange={setRecord}
        onNewsChange={setNews}
        onMenuChange={setMenu}
        onSchedulesChange={setSchedules}
      />
    </>
  );
}
