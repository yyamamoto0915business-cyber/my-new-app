"use client";

import { useEffect, useState } from "react";
import type { EventFormData } from "@/lib/events";
import type { StoreRecord } from "@/lib/stores/types";
import {
  EventFormError,
  EventFormHint,
  EventFormLabel,
  eventFormInp,
  eventFormInpSm,
} from "@/components/organizer/events/event-form-ui";

type Props = {
  form: EventFormData;
  setForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  compact?: boolean;
  error?: string;
};

/** 開催店舗セレクト。選択時に会場名・住所・アクセスを店舗情報で埋める */
export function EventFormStoreSelect({ form, setForm, compact, error }: Props) {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizer/stores?kind=store", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { stores?: StoreRecord[] };
        if (!cancelled) setStores(json.stores ?? []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // URL や複製で storeId だけ入っている場合、会場情報を一度だけ補完
  useEffect(() => {
    if (!form.storeId || stores.length === 0) return;
    if (form.location?.trim()) return;
    const store = stores.find((s) => s.id === form.storeId);
    if (!store) return;
    setForm((prev) => ({
      ...prev,
      location: store.name?.trim() || prev.location,
      address: store.address?.trim() || prev.address,
      access: store.accessNote?.trim() || prev.access,
    }));
  }, [form.storeId, form.location, stores, setForm]);

  const inp = compact ? eventFormInpSm : eventFormInp;

  function applyStore(storeId: string) {
    if (!storeId) {
      setForm((prev) => ({ ...prev, storeId: null }));
      return;
    }
    const store = stores.find((s) => s.id === storeId);
    setForm((prev) => ({
      ...prev,
      storeId,
      location: store?.name?.trim() || prev.location,
      address: store?.address?.trim() || prev.address,
      access: store?.accessNote?.trim() || prev.access,
    }));
  }

  return (
    <div>
      <EventFormLabel label="開催店舗" opt="任意" />
      <select
        value={form.storeId ?? ""}
        onChange={(e) => applyStore(e.target.value)}
        className={inp}
        disabled={loading}
      >
        <option value="">指定しない</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
            {s.status !== "public" ? `（${s.status === "draft" ? "下書き" : "非公開"}）` : ""}
          </option>
        ))}
      </select>
      <EventFormHint text="店舗を選ぶと会場名・住所・アクセスが自動で入ります" />
      <EventFormError msg={error} />
    </div>
  );
}
