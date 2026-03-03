"use client";

import { useState, useEffect, useCallback, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OrganizerHeader } from "@/components/organizer/organizer-header";
import type { SponsorApplication, SponsorTier } from "@/lib/db/types";
import { setSponsorStatusFromForm } from "./actions";

function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "処理中..." : children}
    </button>
  );
}

function StatusButtons({
  eventId,
  applicationId,
  formAction,
}: {
  eventId: string;
  applicationId: string;
  formAction: (payload: FormData) => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <form action={formAction} className="inline">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="status" value="approved" />
        <SubmitButton className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          承認
        </SubmitButton>
      </form>
      <form action={formAction} className="inline">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="status" value="rejected" />
        <SubmitButton className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50">
          却下
        </SubmitButton>
      </form>
    </div>
  );
}

type TabStatus = "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<string, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrganizerSponsorsPage() {
  const params = useParams() as { id?: string };
  const eventId = String(params.id ?? "");
  const [applications, setApplications] = useState<SponsorApplication[]>([]);
  const [tierMap, setTierMap] = useState<Record<string, SponsorTier>>({});
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabStatus>("pending");
  const [actionState, formAction] = useActionState(setSponsorStatusFromForm, null);

  const fetchData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [sponsorsRes, eventRes] = await Promise.all([
        fetch(`/api/organizer/events/${eventId}/sponsors`),
        fetch(`/api/events/${eventId}`).catch(() => null),
      ]);
      if (!sponsorsRes.ok) throw new Error("Failed to fetch");
      const sponsorsData = await sponsorsRes.json();
      setApplications(sponsorsData.applications ?? []);
      setTierMap(sponsorsData.tierMap ?? {});
      if (eventRes?.ok) {
        const eventData = await eventRes.json();
        setEventTitle(eventData.title ?? "イベント");
      }
    } catch {
      setApplications([]);
      setTierMap({});
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (actionState && !actionState.error) {
      fetchData();
    }
  }, [actionState, fetchData]);

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  const displayed = tab === "pending" ? pending : tab === "approved" ? approved : rejected;

  if (!eventId) {
    return (
      <div className="min-h-screen bg-[var(--mg-paper)]">
        <OrganizerHeader title="スポンサー管理" backHref="/organizer/events" backLabel="← 主催イベントへ" />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm text-zinc-500">イベントIDが不正です</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mg-paper)]">
      <OrganizerHeader
        title={`スポンサー管理 / ${eventTitle || "読み込み中..."}`}
        description="企業スポンサー申込の承認・却下"
        backHref="/organizer/events"
        backLabel="← 主催イベントへ"
        primaryCtaLabel="イベント詳細"
        primaryCtaHref={`/events/${eventId}`}
      />
      <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ) : (
          <>
            {actionState?.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {actionState.error}
              </div>
            )}
            <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
              {(["pending", "approved", "rejected"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                    tab === t
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  {STATUS_LABELS[t]} ({t === "pending" ? pending.length : t === "approved" ? approved.length : rejected.length})
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {displayed.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                  {STATUS_LABELS[tab]}の申込はありません
                </div>
              ) : (
                displayed.map((app) => {
                  const tier = tierMap[app.tierId];
                  return (
                    <div
                      key={app.id}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          {app.logoUrl ? (
                            <img
                              src={app.logoUrl}
                              alt={app.companyName}
                              className="h-10 w-10 shrink-0 rounded object-contain"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-200 text-sm font-medium dark:bg-zinc-700">
                              {app.companyName.slice(0, 1)}
                            </span>
                          )}
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {app.companyName}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {tier?.name ?? "—"}（¥{tier?.price?.toLocaleString() ?? "—"}）/ {app.personName} / {app.email}
                            </p>
                          </div>
                        </div>
                        {app.message && (
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            {app.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-zinc-500">
                          申込日時: {formatDate(app.createdAt)}
                        </p>
                      </div>
                      {tab === "pending" && (
                        <StatusButtons
                          eventId={eventId}
                          applicationId={app.id}
                          formAction={formAction}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <p className="mt-6 text-center">
              <Link
                href={`/events/${eventId}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                イベント詳細で approved 企業の表示を確認
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
