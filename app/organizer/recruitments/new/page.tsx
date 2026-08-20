"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { DraftSaveButton, DraftSaveHint } from "@/components/organizer/events/DraftSaveButtonWithHint";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { EventGalleryImagesInput } from "@/components/organizer/events/EventGalleryImagesInput";
import { ApplicationFormSettingsPc } from "@/components/organizer/recruitments/ApplicationFormSettingsPc";
import { RecruitmentFormPcStepIndicator } from "@/components/organizer/recruitments/RecruitmentFormPcStepIndicator";
import { RecruitmentPublishSuccess } from "@/components/organizer/recruitments/RecruitmentPublishSuccess";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createClient } from "@/lib/supabase/client";
import {
  type ApplicationFormConfig,
  createDefaultApplicationFormConfig,
  enabledApplicationFormItems,
  parseApplicationFormConfig,
} from "@/lib/recruitment-application-form";

type Step = 1 | 2 | 3 | 4;
type PcStep = 1 | 2 | 3;

type FormData = {
  title: string;
  description: string;
  imageUrl: string;
  galleryImages: string[];
  eventId: string;
  roles: { name: string; count: number }[];
  start_at: string;
  end_at: string;
  meeting_place: string;
  capacity: number | null;
  items_to_bring: string;
  provisions: string;
  notes: string;
};

type OrgEvent = { id: string; title: string; date: string | null };

const initial: FormData = {
  title: "",
  description: "",
  imageUrl: "",
  galleryImages: [],
  eventId: "",
  roles: [{ name: "受付", count: 1 }],
  start_at: "",
  end_at: "",
  meeting_place: "",
  capacity: null,
  items_to_bring: "",
  provisions: "",
  notes: "",
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && !iso.includes("Z") && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    return iso.slice(0, 16);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


const inp =
  "w-full min-w-0 rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
const inpSm =
  "w-full min-w-0 rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-[12px] py-[9px] text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white";
const inpErr = "!border-[#E8708A]";

function Fl({
  label,
  required,
  opt,
}: {
  label: string;
  required?: boolean;
  opt?: boolean;
}) {
  return (
    <div className="mb-[5px] flex items-center gap-[5px] text-[13px] font-[500]">
      {label}
      {required && (
        <span className="rounded-[4px] bg-[#FEF2F2] px-[5px] py-[1px] text-[9px] font-[600] text-[#E8708A]">
          必須
        </span>
      )}
      {opt && <span className="text-[10px] text-[#888]">任意</span>}
    </div>
  );
}
function Fh({ text }: { text: string }) {
  return <p className="mt-[4px] text-[11px] leading-[1.5] text-[#888]">{text}</p>;
}
function Fe({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-[4px] text-[11px] text-[#E8708A]">{msg}</p>;
}

// ── Mobile step indicator (3 steps) ──
function StepIndicator({
  current,
  onGo,
}: {
  current: Step;
  onGo: (s: Step) => void;
}) {
  const steps: Array<{ n: Step; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "日時・条件" },
    { n: 3, label: "応募フォーム" },
    { n: 4, label: "確認・公開", isCheck: true },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map(({ n, label, isCheck }, i) => {
        const isDone = current > n;
        const isActive = current === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onGo(n)}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-[3px] rounded-lg transition-colors hover:bg-[#f5f4f0]"
            >
              <div
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-[700] transition-all"
                style={{
                  background: isDone || isActive ? "#6BBF3E" : "#F3F2EF",
                  color: isDone || isActive ? "#fff" : "#999",
                  border: isDone || isActive ? "none" : "1.5px solid #e8e6e0",
                }}
              >
                {isDone ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  n
                ) : isCheck ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 11 12 14 22 4" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <div
                className="whitespace-nowrap text-[9px]"
                style={{
                  color: isDone ? "#6BBF3E" : isActive ? "#2B3A6B" : "#999",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </div>
            </button>
            {i < steps.length - 1 && (
              <div
                className="mx-[4px] mb-[14px] h-[1.5px] flex-1"
                style={{ background: current > n ? "#6BBF3E" : "#e8e6e0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Role list (shared between PC and mobile) ──
function RoleList({
  roles,
  onAdd,
  onRemove,
  onUpdate,
}: {
  roles: { name: string; count: number }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: "name" | "count", val: string | number) => void;
}) {
  return (
    <div>
      <div className="mb-[9px] flex flex-col gap-[8px]">
        {roles.map((role, i) => (
          <div
            key={i}
            className="flex items-center gap-[7px] rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[10px] py-[8px]"
          >
            <input
              type="text"
              value={role.name}
              onChange={(e) => onUpdate(i, "name", e.target.value)}
              placeholder="役割名（例：受付）"
              className="flex-1 rounded-[8px] border border-[#e8e6e0] bg-white px-[10px] py-[7px] text-[13px] text-[#1a1a1a] outline-none focus:border-[#2B3A6B]"
            />
            <input
              type="number"
              min={1}
              value={role.count}
              onChange={(e) => onUpdate(i, "count", parseInt(e.target.value, 10) || 1)}
              className="w-[54px] rounded-[8px] border border-[#e8e6e0] bg-white px-[8px] py-[7px] text-center text-[13px] text-[#1a1a1a] outline-none focus:border-[#2B3A6B]"
            />
            <span className="whitespace-nowrap text-[12px] text-[#888]">名</span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={roles.length <= 1}
              className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] text-[#888] transition hover:bg-[#FEF2F2] hover:text-[#E8708A] disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-[5px] rounded-[9px] border border-dashed border-[#e8e6e0] bg-transparent px-[12px] py-[8px] text-[13px] font-[500] text-[#2B3A6B] transition hover:border-[#2B3A6B] hover:bg-[#EEF2FF]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        役割を追加する
      </button>
    </div>
  );
}

// ── PC right-side panel（進捗のみ。操作はヘッダー）──
function PcSidePanel({
  pcStep,
  form,
  formConfig,
}: {
  pcStep: PcStep;
  form: FormData;
  formConfig: ApplicationFormConfig;
}) {
  const formItems = enabledApplicationFormItems(formConfig);

  const prog =
    pcStep === 2
      ? [
          {
            key: "基本プロフィール",
            done: formConfig.fields.some((f) => f.section === "profile" && f.enabled),
          },
          {
            key: "今回の応募項目",
            done: formConfig.fields.some((f) => f.section === "application" && f.enabled),
          },
          {
            key: "規約同意など",
            done: formConfig.fields.some((f) => f.id === "terms" && f.enabled),
          },
          {
            key: "カスタム質問",
            done:
              formConfig.customQuestions.length === 0 ||
              formConfig.customQuestions.every((q) => q.label.trim().length > 0),
          },
        ]
      : [
          { key: "タイトル", done: !!form.title.trim() },
          { key: "説明", done: !!form.description.trim() },
          { key: "役割・人数", done: form.roles.some((r) => r.name.trim()) },
          { key: "開始日時", done: !!form.start_at },
          { key: "集合場所", done: !!form.meeting_place.trim() },
        ];

  const filled = prog.filter((p) => p.done).length;
  const pct = Math.round((filled / Math.max(prog.length, 1)) * 100);

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-l border-[#e8e6e0] bg-[#fafaf8] min-[900px]:min-h-0">
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        <div className="rounded-[10px] border border-[#e8e6e0] bg-white p-2.5 shadow-sm">
          <div className="mb-2 flex items-center text-[12px] font-semibold text-[#1a1a1a]">
            入力の進捗
            <span className="ml-auto tabular-nums text-[#2B3A6B]">
              {filled}/{prog.length}
            </span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#f0eeea]">
            <div
              className="h-full rounded-full bg-[#6BBF3E] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-0.5">
            {prog.map(({ key, done }) => (
              <li key={key} className="flex items-center gap-2 rounded-[6px] px-1 py-0.5">
                <div
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: done ? "#6BBF3E" : "#E8708A" }}
                  aria-hidden
                >
                  {done ? "✓" : "!"}
                </div>
                <span className="flex-1 text-[12px] text-[#1a1a1a]">{key}</span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: done ? "#3a7a10" : "#c45a6a" }}
                >
                  {done ? "完了" : "未入力"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {pcStep === 2 ? (
          <div className="mt-2 rounded-[10px] border border-[#e8e6e0] bg-white p-2.5 shadow-sm">
            <p className="mb-1.5 text-[11px] font-semibold text-[#888]">現在の応募フォーム</p>
            {formItems.length === 0 ? (
              <p className="text-[12px] text-[#8a9e80]">項目がありません</p>
            ) : (
              <ul className="space-y-1.5">
                {formItems.map((item) => (
                  <li key={item.label} className="flex items-start justify-between gap-2 text-[12px]">
                    <span className="text-[#1a2818]">{item.label}</span>
                    <span
                      className={
                        item.badge === "required"
                          ? "shrink-0 rounded bg-[#FEF2F2] px-1.5 py-0.5 text-[9px] font-semibold text-[#E8708A]"
                          : item.badge === "auto"
                            ? "shrink-0 rounded bg-[#eef3ea] px-1.5 py-0.5 text-[9px] font-semibold text-[#3a7a10]"
                            : "shrink-0 text-[10px] text-[#888]"
                      }
                    >
                      {item.badge === "required"
                        ? "必須"
                        : item.badge === "auto"
                          ? "自動取得"
                          : "任意"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div className="mt-2 space-y-2">
          <DraftSaveHint multiline destinationLabel="スタッフ募集" />
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e8e6e0] bg-[#fafaf8] px-2.5 py-2">
        <p className="text-center text-[10.5px] text-[#888]">STEP {pcStep} / 3</p>
      </div>
    </aside>
  );
}

// ── Mobile card wrapper ──
function Card({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[10px] rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]">
      <div className="mb-[3px] flex items-center gap-[6px] text-[13px] font-[600]">
        {icon}
        {title}
      </div>
      <p className="mb-[14px] text-[11px] text-[#888]">{sub}</p>
      {children}
    </div>
  );
}

function FieldWrap({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 last:mb-0">{children}</div>;
}

// ── Confirm summary row ──
function SRow({ label, value, empty }: { label: string; value: string; empty?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-[10px] border-b border-[#f5f3ef] py-[8px] last:border-b-0">
      <div className="w-[72px] shrink-0 text-[11px] text-[#888]">{label}</div>
      <div
        className="flex-1 text-right text-[12px] font-[500] leading-[1.5]"
        style={{ color: empty ? "#ccc" : "#1a1a1a", fontWeight: empty ? 400 : 500 }}
      >
        {value}
      </div>
    </div>
  );
}

function NewRecruitmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("editId")?.trim() || null;
  const isEdit = Boolean(editId);
  const previewSuccess =
    process.env.NODE_ENV !== "production" &&
    searchParams?.get("previewSuccess") === "1";

  const [step, setStep] = useState<Step>(previewSuccess ? 4 : 1);
  const [pcStep, setPcStep] = useState<PcStep>(previewSuccess ? 3 : 1);
  const [form, setForm] = useState<FormData>(initial);
  const [formConfig, setFormConfig] = useState<ApplicationFormConfig>(
    createDefaultApplicationFormConfig
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<null | "draft" | "create">(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [originalStatus, setOriginalStatus] = useState<"draft" | "public" | "closed">("draft");
  const [publishDone, setPublishDone] = useState(previewSuccess);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (!previewSuccess) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/volunteer/roles", undefined, 8_000);
        if (!res.ok) return;
        const data = (await res.json().catch(() => null)) as
          | Array<{ id?: string; source?: string }>
          | { roles?: Array<{ id?: string }> }
          | null;
        const list = Array.isArray(data) ? data : data?.roles ?? [];
        const sample =
          list.find((r) => typeof r.id === "string" && /^[0-9a-f-]{36}$/i.test(r.id))?.id ??
          list.find((r) => typeof r.id === "string" && r.id.length > 0)?.id ??
          null;
        if (!cancelled && sample) setPublishedId(sample);
      } catch {
        /* プレビュー用サンプルが取れなくても完了UIは表示する */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewSuccess]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase
        .from("organizers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!org?.id) return;
      const { data: evts } = await supabase
        .from("events")
        .select("id,title,date")
        .eq("organizer_id", org.id)
        .order("date", { ascending: false })
        .limit(30);
      if (evts) setEvents(evts as OrgEvent[]);
    })();
  }, []);

  useEffect(() => {
    if (!editId) {
      setLoadingEdit(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEdit(true);
      setGlobalError(null);
      try {
        const res = await fetchWithTimeout(`/api/recruitments/${editId}`);
        const data = (await res.json().catch(() => null)) as
          | {
              id?: string;
              title?: string;
              description?: string;
              status?: string;
              start_at?: string | null;
              end_at?: string | null;
              meeting_place?: string | null;
              capacity?: number | null;
              items_to_bring?: string | null;
              provisions?: string | null;
              notes?: string | null;
              image_url?: string | null;
              gallery_images?: string[] | null;
              roles?: { name: string; count: number }[];
              event_id?: string | null;
              application_form_config?: unknown;
            }
          | null;
        if (!res.ok || !data?.id) {
          throw new Error((data as { error?: string } | null)?.error ?? "募集の読み込みに失敗しました");
        }
        if (cancelled) return;
        const status =
          data.status === "public" || data.status === "closed" || data.status === "draft"
            ? data.status
            : "draft";
        setOriginalStatus(status);
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          imageUrl: data.image_url ?? "",
          galleryImages: Array.isArray(data.gallery_images)
            ? data.gallery_images.filter((x): x is string => typeof x === "string")
            : [],
          eventId: data.event_id ?? "",
          roles:
            Array.isArray(data.roles) && data.roles.length > 0
              ? data.roles.map((r) => ({ name: r.name ?? "", count: Number(r.count ?? 1) || 1 }))
              : [{ name: "受付", count: 1 }],
          start_at: toDatetimeLocal(data.start_at),
          end_at: toDatetimeLocal(data.end_at),
          meeting_place: data.meeting_place ?? "",
          capacity: data.capacity ?? null,
          items_to_bring: data.items_to_bring ?? "",
          provisions: data.provisions ?? "",
          notes: data.notes ?? "",
        });
        setFormConfig(parseApplicationFormConfig(data.application_form_config));
        setPcStep(1);
      } catch (err) {
        if (!cancelled) {
          setGlobalError(err instanceof Error ? err.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key as string];
      return n;
    });
    setGlobalError(null);
  };

  const addRole = () =>
    setForm((prev) => ({ ...prev, roles: [...prev.roles, { name: "", count: 1 }] }));
  const removeRole = (i: number) => {
    if (form.roles.length <= 1) return;
    setForm((prev) => ({ ...prev, roles: prev.roles.filter((_, idx) => idx !== i) }));
  };
  const updateRole = (i: number, field: "name" | "count", val: string | number) => {
    setForm((prev) => {
      const roles = [...prev.roles];
      roles[i] = { ...roles[i], [field]: val };
      return { ...prev, roles };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "タイトルを入力してください";
    if (!form.description.trim()) errs.description = "説明を入力してください";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = (status: "draft" | "public" | "closed") => ({
    title: form.title.trim(),
    description: form.description.trim(),
    image_url: form.imageUrl.trim() || null,
    gallery_images: form.galleryImages,
    status,
    start_at: form.start_at || null,
    end_at: form.end_at || null,
    meeting_place: form.meeting_place.trim() || null,
    capacity: form.capacity,
    items_to_bring: form.items_to_bring.trim() || null,
    provisions: form.provisions.trim() || null,
    notes: form.notes.trim() || null,
    roles: form.roles.filter((r) => r.name.trim()),
    event_id: form.eventId || null,
    application_form_config: formConfig,
  });

  const saveDraft = async () => {
    setSaving("draft");
    setGlobalError(null);
    try {
      if (isEdit && editId) {
        const res = await fetchWithTimeout(`/api/recruitments/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload("draft")),
        });
        const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
        router.push(`/organizer/recruitments/${editId}`);
        return;
      }
      const res = await fetchWithTimeout("/api/recruitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("draft")),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "保存に失敗しました");
      router.push(`/organizer/recruitments/${data.id}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(null);
    }
  };

  const showPublishSuccess = (id: string) => {
    setPublishedId(id);
    setPublishDone(true);
    setStep(4);
    setPcStep(3);
  };

  const createRecruitment = async () => {
    if (!validate()) {
      if (step !== 1) setStep(1);
      setPcStep(1);
      return;
    }
    setSaving("create");
    setGlobalError(null);
    try {
      if (isEdit && editId) {
        const nextStatus = originalStatus === "closed" ? "closed" : "public";
        const res = await fetchWithTimeout(`/api/recruitments/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(nextStatus)),
        });
        const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "更新に失敗しました");
        if (nextStatus === "public" && originalStatus === "draft") {
          showPublishSuccess(editId);
          return;
        }
        router.push(`/organizer/recruitments/${editId}`);
        return;
      }
      const res = await fetchWithTimeout("/api/recruitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("public")),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "作成に失敗しました");
      if (!data.id) throw new Error("作成に失敗しました");
      showPublishSuccess(data.id);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(null);
    }
  };

  const handlePcPrimary = () => {
    if (pcStep === 1) {
      const errs: Record<string, string> = {};
      if (!form.title.trim()) errs.title = "タイトルを入力してください";
      if (!form.description.trim()) errs.description = "説明を入力してください";
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      setPcStep(2);
      return;
    }
    if (pcStep === 2) {
      setPcStep(3);
      return;
    }
    void createRecruitment();
  };

  const handleBack = () => {
    if (publishDone) {
      router.push("/organizer/recruitments");
      return;
    }
    if (step > 1) setStep((s) => (s - 1) as Step);
    else if (isEdit && editId) router.push(`/organizer/recruitments/${editId}`);
    else router.push("/organizer/recruitments");
  };

  const handleNext = () => {
    if (step === 1) {
      const errs: Record<string, string> = {};
      if (!form.title.trim()) errs.title = "タイトルを入力してください";
      if (!form.description.trim()) errs.description = "説明を入力してください";
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }
    if (step < 4) setStep((s) => (s + 1) as Step);
  };

  const nextLabel =
    step === 1 ? "日時・条件へ" : step === 2 ? "応募フォームへ" : "確認へ進む";
  const hasErrors = !form.title.trim() || !form.description.trim();
  const pcPrimaryLabel =
    pcStep === 1
      ? "応募フォームの設定へ"
      : pcStep === 2
        ? "確認へ進む"
        : isEdit
          ? "変更を保存"
          : "作成して公開する";
  const pcPageTitle =
    pcStep === 1
      ? isEdit
        ? "スタッフ募集を編集"
        : "スタッフ募集を作成"
      : pcStep === 2
        ? "応募フォームの設定"
        : isEdit
          ? "確認・保存"
          : "確認・公開";
  const pcPageSubtitle =
    pcStep === 1
      ? "募集の基本情報と日時・条件を入力してください"
      : pcStep === 2
        ? "応募者に入力してもらう内容と必須項目を設定しましょう"
        : "内容を確認して公開しましょう";
  const pageTitle = isEdit ? "スタッフ募集を編集" : "スタッフ募集を新規作成";
  const primaryLabel =
    saving === "create" ? (isEdit ? "保存中…" : "作成中…") : isEdit ? "変更を保存" : "作成する";
  const successPcPageTitle = "公開完了";
  const successPcPageSubtitle = "スタッフ募集の公開が完了しました";
  const successPublishedId = publishedId ?? "";
  const successIsPreview = previewSuccess;

  if (loadingEdit) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#888]">
        読み込み中…
      </div>
    );
  }

  // Summary display values
  const rolesText =
    form.roles.filter((r) => r.name.trim()).map((r) => `${r.name}（${r.count}名）`).join("、") || "—";
  const selectedEvent = events.find((e) => e.id === form.eventId);
  const eventText = selectedEvent ? selectedEvent.title : null;
  const startText = form.start_at
    ? new Date(form.start_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;
  const endText = form.end_at
    ? new Date(form.end_at).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;

  // ── Shared field sections (rendered in both PC and mobile) ──
  const basicFields = (
    <>
      <FieldWrap>
        <Fl label="タイトル" required />
        <input
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="例：フリマ受付スタッフ募集"
          className={`${inp} ${errors.title ? inpErr : ""}`}
        />
        <Fe msg={errors.title} />
      </FieldWrap>
      <FieldWrap>
        <Fl label="説明" required />
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="募集内容の詳細。どんな仕事か、やりがいや参加するメリットなどを伝えましょう。"
          className={`${inp} min-h-[4.5rem] resize-y ${errors.description ? inpErr : ""}`}
        />
        <Fe msg={errors.description} />
      </FieldWrap>
      <FieldWrap>
        <Fl label="アイキャッチ画像" opt />
        <div className="space-y-2 rounded-[10px] border border-[#ebe8e2] bg-[#fafaf8] p-2">
          <EventImageInput
            url={form.imageUrl}
            onChangeUrl={(url) => update("imageUrl", url)}
            alt={form.title || "プレビュー"}
            compact
            bare
            hint="一覧は代表画像のみ"
          />
          <div className="border-t border-[#ebe8e2] pt-2">
            <EventGalleryImagesInput
              compact
              urls={form.galleryImages}
              onChange={(galleryImages) => update("galleryImages", galleryImages)}
            />
          </div>
        </div>
      </FieldWrap>
      <FieldWrap>
        <Fl label="開催イベント" opt />
        <select
          value={form.eventId}
          onChange={(e) => update("eventId", e.target.value)}
          className={inp}
        >
          <option value="">イベントを選択（任意）</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}{ev.date ? `（${ev.date}）` : ""}
            </option>
          ))}
        </select>
      </FieldWrap>
      <FieldWrap>
        <Fl label="役割と必要人数" required />
        <RoleList
          roles={form.roles}
          onAdd={addRole}
          onRemove={removeRole}
          onUpdate={updateRole}
        />
      </FieldWrap>
    </>
  );

  const conditionFields = (
    <>
      <FieldWrap>
        <div className="grid grid-cols-1 gap-[12px] min-[900px]:grid-cols-2">
          <div className="min-w-0">
            <Fl label="開始日時" opt />
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => update("start_at", e.target.value)}
              className={`${inpSm} max-w-full`}
              style={{ fontSize: 12 }}
            />
          </div>
          <div className="min-w-0">
            <Fl label="終了日時" opt />
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => update("end_at", e.target.value)}
              className={`${inpSm} max-w-full`}
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
      </FieldWrap>
      <FieldWrap>
        <Fl label="集合場所" opt />
        <input
          type="text"
          value={form.meeting_place}
          onChange={(e) => update("meeting_place", e.target.value)}
          placeholder="例：〇〇公民館 正面玄関"
          className={inp}
        />
        <Fh text="集合場所が会場と異なる場合に入力してください" />
      </FieldWrap>
      <FieldWrap>
        <Fl label="募集人数（定員）" opt />
        <div className="flex items-center gap-[10px]">
          <input
            type="number"
            min={1}
            value={form.capacity ?? ""}
            onChange={(e) =>
              update("capacity", e.target.value ? parseInt(e.target.value, 10) : null)
            }
            placeholder="未入力で無制限"
            className="w-[120px] rounded-[10px] border border-[#e8e6e0] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#2B3A6B] focus:bg-white"
          />
          <span className="text-[13px] text-[#888]">名まで（未入力で無制限）</span>
        </div>
      </FieldWrap>
      <FieldWrap>
        <Fl label="持ち物・服装" opt />
        <input
          type="text"
          value={form.items_to_bring}
          onChange={(e) => update("items_to_bring", e.target.value)}
          placeholder="例：動きやすい服、飲み物"
          className={inp}
        />
      </FieldWrap>
      <FieldWrap>
        <Fl label="支給（交通費・食事など）" opt />
        <input
          type="text"
          value={form.provisions}
          onChange={(e) => update("provisions", e.target.value)}
          placeholder="例：交通費実費支給・昼食あり"
          className={inp}
        />
        <Fh text="スタッフへの支給内容があれば記載してください" />
      </FieldWrap>
      <FieldWrap>
        <Fl label="注意事項" opt />
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="参加スタッフへの注意事項や特記事項があれば入力してください"
          className={`${inp} resize-none`}
        />
      </FieldWrap>
    </>
  );

  return (
    <div className="relative z-[1] flex flex-col min-[900px]:-mx-8 min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:bg-white">

      {/* ── PC: Header（イベント作成と同型）── */}
      <header className="z-10 hidden shrink-0 border-b border-[#d8d4cc] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] min-[900px]:block">
        <div className="flex items-center gap-4 px-6 py-1.5">
          <button
            type="button"
            onClick={() => {
              if (publishDone) {
                router.push("/organizer/recruitments");
                return;
              }
              if (pcStep > 1) setPcStep((s) => (s - 1) as PcStep);
              else if (isEdit && editId) router.push(`/organizer/recruitments/${editId}`);
              else router.push("/organizer/recruitments");
            }}
            className="flex w-[9rem] shrink-0 items-center gap-1 text-left text-[11px] font-medium text-[#4a4844] hover:text-[#2B3A6B]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0" aria-hidden>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="truncate">
              {publishDone
                ? "募集一覧へ"
                : pcStep === 1
                  ? "募集一覧へ"
                  : pcStep === 2
                    ? "基本情報に戻る"
                    : "フォーム設定に戻る"}
            </span>
          </button>
          <RecruitmentFormPcStepIndicator
            current={pcStep}
            onGo={(s) => {
              if (publishDone) return;
              setPcStep(s);
            }}
            canGoTo={(s) =>
              !publishDone && (s === 1 || (!!form.title.trim() && !!form.description.trim()))
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edeae4] bg-[#fafaf8] px-6 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
              {publishDone ? successPcPageTitle : pcPageTitle}
            </p>
            <p className="truncate text-[11px] text-[#888]">
              {publishDone ? successPcPageSubtitle : pcPageSubtitle}
            </p>
          </div>
          {!publishDone ? (
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
              <Link
                href={isEdit && editId ? `/organizer/recruitments/${editId}` : "/organizer/recruitments"}
                className="rounded-[8px] border border-[#d0ccc4] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0]"
              >
                キャンセル
              </Link>
              <button
                type="button"
                onClick={saveDraft}
                disabled={!!saving}
                className="flex items-center gap-1.5 rounded-[8px] border border-[#d0ccc4] bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f5f4f0] disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                {saving === "draft" ? "保存中…" : "下書き保存"}
              </button>
              <button
                type="button"
                onClick={handlePcPrimary}
                disabled={!!saving || (pcStep === 1 && hasErrors)}
                className={[
                  "min-w-[6rem] rounded-[8px] px-4 py-1.5 text-[11px] font-semibold transition",
                  !(pcStep === 1 && hasErrors) && !saving
                    ? "bg-[#2B3A6B] text-white hover:bg-[#243159]"
                    : "cursor-not-allowed bg-[#ebe8e2] text-[#8a8680]",
                ].join(" ")}
              >
                {saving === "create" ? (isEdit ? "保存中…" : "作成中…") : pcPrimaryLabel}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* ── Mobile: Header + step indicator ── */}
      <div className="min-[900px]:hidden sticky top-0 z-10 border-b border-[#e8e6e0] bg-white">
        <div className="flex items-center gap-[8px] px-[14px] py-[9px]">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#F3F2EF]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1 truncate text-[13px] font-[600]">
            {publishDone ? "公開完了" : pageTitle}
          </div>
        </div>
        <div className="px-[14px] pb-[10px]">
          <StepIndicator
            current={step}
            onGo={(s) => {
              if (publishDone) return;
              if (s > 1 && (!form.title.trim() || !form.description.trim())) {
                const errs: Record<string, string> = {};
                if (!form.title.trim()) errs.title = "タイトルを入力してください";
                if (!form.description.trim()) errs.description = "説明を入力してください";
                setErrors(errs);
                setStep(1);
                return;
              }
              setStep(s);
            }}
          />
        </div>
      </div>

      {/* ── Global error ── */}
      {globalError && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 min-[900px]:mx-6">
          {globalError}
        </div>
      )}

      {/* ── PC: stepped layout ── */}
      <div className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:border-t min-[900px]:border-[#e8e6e0]">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-3">
          {pcStep === 1 ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="mb-3 border-b border-[#e8e6e0] pb-2">
                  <div className="mb-[2px] flex items-center gap-[7px] text-[14px] font-[600]">
                    基本情報
                  </div>
                  <p className="text-[11px] text-[#888]">募集のタイトルと内容を入力してください</p>
                </div>
                {basicFields}
              </div>
              <div>
                <div className="mb-3 border-b border-[#e8e6e0] pb-2">
                  <div className="mb-[2px] flex items-center gap-[7px] text-[14px] font-[600]">
                    日時・条件
                  </div>
                  <p className="text-[11px] text-[#888]">活動日時と参加条件を設定します</p>
                </div>
                {conditionFields}
              </div>
            </div>
          ) : null}

          {pcStep === 2 ? (
            <ApplicationFormSettingsPc config={formConfig} onChange={setFormConfig} />
          ) : null}

          {pcStep === 3 ? (
            publishDone ? (
              <RecruitmentPublishSuccess
                recruitmentId={successPublishedId}
                isPreview={successIsPreview}
              />
            ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="rounded-xl border border-[#e8e6e0] bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-[#1a2818]">基本情報・条件</h3>
                  <button
                    type="button"
                    onClick={() => setPcStep(1)}
                    className="text-[12px] font-medium text-[#2B3A6B] hover:underline"
                  >
                    編集
                  </button>
                </div>
                <dl className="space-y-2 text-[13px]">
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-[#8a9e80]">タイトル</dt>
                    <dd className="font-medium text-[#1a2818]">{form.title.trim() || "—"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-[#8a9e80]">画像</dt>
                    <dd className="text-[#1a2818]">{form.imageUrl.trim() ? "設定済み" : "—"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-[#8a9e80]">日時</dt>
                    <dd className="text-[#1a2818]">
                      {startText ?? "—"}
                      {endText ? ` 〜 ${endText}` : ""}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-[#8a9e80]">集合場所</dt>
                    <dd className="text-[#1a2818]">{form.meeting_place.trim() || "—"}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-[#8a9e80]">役割</dt>
                    <dd className="text-[#1a2818]">{rolesText}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-[#e8e6e0] bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[14px] font-semibold text-[#1a2818]">応募フォーム</h3>
                  <button
                    type="button"
                    onClick={() => setPcStep(2)}
                    className="text-[12px] font-medium text-[#2B3A6B] hover:underline"
                  >
                    編集
                  </button>
                </div>
                <ul className="space-y-2">
                  {enabledApplicationFormItems(formConfig).map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-2 border-b border-[#f0f2ec] py-2 text-[13px] last:border-0"
                    >
                      <span>{item.label}</span>
                      <span
                        className={
                          item.badge === "required"
                            ? "rounded bg-[#FEF2F2] px-1.5 py-0.5 text-[9px] font-semibold text-[#E8708A]"
                            : item.badge === "auto"
                              ? "rounded bg-[#eef3ea] px-1.5 py-0.5 text-[9px] font-semibold text-[#3a7a10]"
                              : "text-[10px] text-[#888]"
                        }
                      >
                        {item.badge === "required"
                          ? "必須"
                          : item.badge === "auto"
                            ? "自動取得"
                            : "任意"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            )
          ) : null}
        </div>

        {!publishDone ? (
          <PcSidePanel pcStep={pcStep} form={form} formConfig={formConfig} />
        ) : null}
      </div>

      {/* ── Mobile: 4ステップ（基本 → 日時・条件 → 応募フォーム → 確認）── */}
      <div className="min-[900px]:hidden">

        {step === 1 && (
          <div className="px-[14px] py-[12px]">
            <Card
              title="基本情報"
              sub="募集のタイトルと内容を入力してください"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              }
            >
              {basicFields}
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="px-[14px] py-[12px]">
            <Card
              title="日時・条件"
              sub="活動日時と参加条件を設定します"
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            >
              {conditionFields}
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="px-[14px] py-[12px] pb-4">
            <ApplicationFormSettingsPc config={formConfig} onChange={setFormConfig} />
          </div>
        )}

        {step === 4 && (
          publishDone ? (
            <div className="px-[14px] py-[12px] pb-6">
              <RecruitmentPublishSuccess
                recruitmentId={successPublishedId}
                isPreview={successIsPreview}
              />
            </div>
          ) : (
          <div className="px-[14px] py-[12px]">
            <div className="mb-[10px] rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]">
              <div className="mb-[8px] flex justify-between text-[11px] font-[600] text-[#888]">
                基本情報
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-[500] text-[#2B3A6B]"
                >
                  編集
                </button>
              </div>
              <SRow label="タイトル" value={form.title.trim() || "未入力"} empty={!form.title.trim()} />
              <SRow
                label="説明"
                value={
                  form.description.trim()
                    ? form.description.trim().slice(0, 50) +
                      (form.description.trim().length > 50 ? "…" : "")
                    : "未入力"
                }
                empty={!form.description.trim()}
              />
              <SRow
                label="画像"
                value={form.imageUrl.trim() ? "設定済み" : "未設定"}
                empty={!form.imageUrl.trim()}
              />
              <SRow label="イベント" value={eventText ?? "未選択"} empty={!eventText} />
              <SRow label="役割" value={rolesText} />
            </div>

            <div className="mb-[10px] rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]">
              <div className="mb-[8px] flex justify-between text-[11px] font-[600] text-[#888]">
                日時・条件
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="font-[500] text-[#2B3A6B]"
                >
                  編集
                </button>
              </div>
              <SRow label="開始日時" value={startText ?? "—"} empty={!startText} />
              <SRow label="終了日時" value={endText ?? "—"} empty={!endText} />
              <SRow
                label="集合場所"
                value={form.meeting_place.trim() || "—"}
                empty={!form.meeting_place.trim()}
              />
              <SRow
                label="募集人数"
                value={form.capacity ? `${form.capacity}名まで` : "無制限"}
                empty={!form.capacity}
              />
              <SRow
                label="持ち物"
                value={form.items_to_bring.trim() || "—"}
                empty={!form.items_to_bring.trim()}
              />
              <SRow
                label="支給"
                value={form.provisions.trim() || "—"}
                empty={!form.provisions.trim()}
              />
            </div>

            <div className="mb-[10px] rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]">
              <div className="mb-[8px] flex justify-between text-[11px] font-[600] text-[#888]">
                応募フォーム
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="font-[500] text-[#2B3A6B]"
                >
                  編集
                </button>
              </div>
              {enabledApplicationFormItems(formConfig).map((item) => (
                <SRow
                  key={item.label}
                  label={item.label}
                  value={
                    item.badge === "required"
                      ? "必須"
                      : item.badge === "auto"
                        ? "自動取得"
                        : "任意"
                  }
                />
              ))}
            </div>

            {hasErrors && (
              <div className="mb-[10px] flex gap-[8px] rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-[13px] py-[11px]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E8708A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mt-[1px] shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="text-[11px] leading-[1.6] text-[#c04060]">
                  タイトルと説明が未入力です。作成するには必須項目を入力してください。
                </div>
              </div>
            )}
          </div>
          )
        )}
      </div>

      {/* ── Mobile: Footer nav ── */}
      {!publishDone && step < 4 ? (
        <div className="min-[900px]:hidden sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <DraftSaveHint
            className="mb-2 whitespace-nowrap px-2 py-1 text-[10px] leading-normal tracking-tight"
            destinationLabel="スタッフ募集"
          />
          <div className="flex items-center gap-1.5">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-[9px] border border-[#e8e6e0] bg-white px-2.5 text-[12px] font-[500]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                戻る
              </button>
            ) : null}
            <DraftSaveButton
              onClick={saveDraft}
              submitting={saving === "draft"}
              className="h-9 px-2.5 text-[12px]"
            />
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-[9px] border-none bg-[#2B3A6B] px-2.5 text-[12px] font-[600] text-white"
            >
              <span className="truncate">{nextLabel}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
      {!publishDone && step >= 4 ? (
        <div className="min-[900px]:hidden sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-[14px] pb-[14px] pt-[10px]">
          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-[5px] rounded-[10px] border border-[#e8e6e0] bg-white px-[18px] py-[11px] text-[13px] font-[500]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              戻る
            </button>
            <button
              type="button"
              onClick={createRecruitment}
              disabled={!!saving || hasErrors}
              className="flex flex-1 items-center justify-center gap-[5px] rounded-[10px] py-[11px] text-[13px] font-[600] text-white transition disabled:opacity-50"
              style={{ background: hasErrors ? "#bbb" : "#6BBF3E" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {primaryLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NewRecruitmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#888]">
          読み込み中…
        </div>
      }
    >
      <NewRecruitmentPageEntry />
    </Suspense>
  );
}

function NewRecruitmentPageEntry() {
  const searchParams = useSearchParams();
  const previewSuccess =
    process.env.NODE_ENV !== "production" &&
    searchParams?.get("previewSuccess") === "1";

  if (previewSuccess) {
    return <NewRecruitmentPageContent />;
  }

  return (
    <OrganizerRegistrationGate>
      <NewRecruitmentPageContent />
    </OrganizerRegistrationGate>
  );
}
