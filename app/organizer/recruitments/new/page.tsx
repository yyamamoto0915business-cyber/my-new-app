"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

type FormData = {
  title: string;
  description: string;
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
function StepIndicator({ current }: { current: Step }) {
  const steps: Array<{ n: Step; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "日時・条件" },
    { n: 3, label: "確認・作成", isCheck: true },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map(({ n, label, isCheck }, i) => {
        const isDone = current > n;
        const isActive = current === n;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex shrink-0 flex-col items-center gap-[3px]">
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
            </div>
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

// ── PC right-side panel ──
function PcSidePanel({
  form,
  onDraft,
  onCreate,
  saving,
}: {
  form: FormData;
  onDraft: () => void;
  onCreate: () => void;
  saving: null | "draft" | "create";
}) {
  const prog = [
    { key: "タイトル", done: !!form.title.trim() },
    { key: "説明", done: !!form.description.trim() },
    { key: "役割・人数", done: form.roles.some((r) => r.name.trim()) },
  ];
  const filled = prog.filter((p) => p.done).length;
  const pct = Math.round((filled / prog.length) * 100);
  const canCreate = !!form.title.trim() && !!form.description.trim();

  return (
    <div className="flex w-[272px] shrink-0 flex-col gap-[14px] min-h-0 overflow-y-auto border-l border-[#e8e6e0] bg-[#fafaf8] p-4">
      {/* Progress */}
      <div className="rounded-[10px] border border-[#e8e6e0] p-[14px]">
        <div className="mb-[10px] flex items-center text-[11px] font-[600] tracking-[.05em] text-[#888]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-[5px]">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          入力の進捗
          <span className="ml-auto text-[12px] font-[600] text-[#2B3A6B]">{filled}/{prog.length}</span>
        </div>
        <div className="mb-[10px] h-[5px] overflow-hidden rounded-[10px] bg-[#f0eeea]">
          <div
            className="h-full rounded-[10px] bg-[#6BBF3E] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {prog.map(({ key, done }) => (
          <div key={key} className="flex items-center gap-[8px] py-[4px]">
            <div className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: done ? "#6BBF3E" : "#E8708A" }} />
            <div className="flex-1 text-[12px]">{key}</div>
            <div className="text-[11px]" style={{ color: done ? "#6BBF3E" : "#E8708A" }}>{done ? "✓" : "未入力"}</div>
          </div>
        ))}
      </div>

      {/* Save / Create */}
      <div className="rounded-[10px] border border-[#e8e6e0] p-[14px]">
        <div className="mb-[10px] text-[11px] font-[600] tracking-[.05em] text-[#888]">保存・作成</div>
        <p className="mb-[12px] text-[12px] leading-[1.6] text-[#555]">
          タイトルと説明を入力すると作成できます。下書き保存はいつでも可能です。
        </p>
        <div className="flex flex-col gap-[7px]">
          <button
            type="button"
            onClick={onDraft}
            disabled={!!saving}
            className="w-full rounded-[9px] border border-[#e8e6e0] bg-white py-[10px] text-[13px] font-[500] hover:bg-[#f5f4f0] disabled:opacity-50"
          >
            {saving === "draft" ? "保存中…" : "下書き保存"}
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={!!saving || !canCreate}
            className="flex w-full items-center justify-center gap-[6px] rounded-[9px] py-[10px] text-[13px] font-[600] text-white transition disabled:opacity-50"
            style={{ background: canCreate && !saving ? "#6BBF3E" : "#bbb" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {saving === "create" ? "作成中…" : "作成して公開する"}
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="rounded-[10px] border border-[#C5DBE8] bg-[#EEF4F8] p-[12px]">
        <div className="mb-[5px] flex items-center gap-[5px] text-[12px] font-[500] text-[#2A5A74]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A5A74" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          役割について
        </div>
        <p className="text-[12px] leading-[1.6] text-[#2A5A74]">
          受付・誘導・設営など役割ごとに追加できます。応募者が自分に合った役割を選んで応募できるようになります。
        </p>
      </div>
    </div>
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
  return <div className="mb-[14px] last:mb-0">{children}</div>;
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
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<null | "draft" | "create">(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);

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

  const buildPayload = (status: "draft" | "public") => ({
    title: form.title.trim(),
    description: form.description.trim(),
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
  });

  const saveDraft = async () => {
    setSaving("draft");
    setGlobalError(null);
    try {
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

  const createRecruitment = async () => {
    if (!validate()) {
      if (step !== 1) setStep(1);
      return;
    }
    setSaving("create");
    setGlobalError(null);
    try {
      const res = await fetchWithTimeout("/api/recruitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload("public")),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "作成に失敗しました");
      router.push(`/organizer/recruitments/${data.id}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSaving(null);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
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
    if (step < 3) setStep((s) => (s + 1) as Step);
  };

  const nextLabel = step === 1 ? "日時・条件へ" : "確認・作成へ";
  const hasErrors = !form.title.trim() || !form.description.trim();

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
        <Fh text="参加者が最初に目にするタイトルです" />
        <Fe msg={errors.title} />
      </FieldWrap>
      <FieldWrap>
        <Fl label="説明" required />
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="募集内容の詳細。どんな仕事か、やりがいや参加するメリットなどを伝えましょう。"
          className={`${inp} resize-none ${errors.description ? inpErr : ""}`}
        />
        <Fe msg={errors.description} />
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
        <Fh text="紐づけると募集がイベントページにも表示されます" />
      </FieldWrap>
      <FieldWrap>
        <Fl label="役割と必要人数" required />
        <RoleList
          roles={form.roles}
          onAdd={addRole}
          onRemove={removeRole}
          onUpdate={updateRole}
        />
        <Fh text="受付・誘導・設営など役割ごとに追加できます" />
      </FieldWrap>
    </>
  );

  const conditionFields = (
    <>
      <FieldWrap>
        <div className="grid grid-cols-2 gap-[12px]">
          <div>
            <Fl label="開始日時" opt />
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => update("start_at", e.target.value)}
              className={inpSm}
              style={{ fontSize: 12 }}
            />
          </div>
          <div>
            <Fl label="終了日時" opt />
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => update("end_at", e.target.value)}
              className={inpSm}
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

      {/* ── PC: Page header ── */}
      <div className="hidden min-[900px]:flex shrink-0 items-center justify-between gap-4 border-b border-[#e8e6e0] bg-white px-6 py-2.5">
        <div>
          <div className="text-[18px] font-[700]">スタッフ募集を新規作成</div>
          <div className="mt-[2px] text-[12px] text-[#888]">役割と日時を設定してスタッフを募集しましょう</div>
        </div>
        <div className="flex shrink-0 gap-[8px]">
          <Link
            href="/organizer/recruitments"
            className="rounded-[9px] border border-[#e8e6e0] bg-white px-[16px] py-[8px] text-[13px] hover:bg-[#f5f4f0]"
          >
            キャンセル
          </Link>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!!saving}
            className="flex items-center gap-[5px] rounded-[9px] border border-[#e8e6e0] bg-white px-[16px] py-[8px] text-[13px] font-[500] hover:bg-[#f5f4f0] disabled:opacity-50"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
            </svg>
            {saving === "draft" ? "保存中…" : "下書き保存"}
          </button>
          <button
            type="button"
            onClick={createRecruitment}
            disabled={!!saving}
            className="flex items-center gap-[6px] rounded-[9px] px-[20px] py-[8px] text-[13px] font-[600] text-white transition disabled:opacity-50"
            style={{ background: "#6BBF3E" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {saving === "create" ? "作成中…" : "作成する"}
          </button>
        </div>
      </div>

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
          <div className="flex-1 text-[13px] font-[600]">スタッフ募集を新規作成</div>
          <div className="flex gap-[5px]">
            <button
              type="button"
              onClick={saveDraft}
              disabled={!!saving}
              className="rounded-[8px] bg-[#F3F2EF] px-[12px] py-[6px] text-[11px] font-[600] disabled:opacity-50"
            >
              {saving === "draft" ? "保存中" : "下書き"}
            </button>
            <button
              type="button"
              onClick={step === 3 ? createRecruitment : handleNext}
              disabled={!!saving}
              className="rounded-[8px] px-[12px] py-[6px] text-[11px] font-[600] text-white disabled:opacity-50"
              style={{ background: "#6BBF3E" }}
            >
              {saving === "create" ? "作成中" : step === 3 ? "作成" : "次へ"}
            </button>
          </div>
        </div>
        <div className="px-[14px] pb-[10px]">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* ── Global error ── */}
      {globalError && (
        <div className="mx-4 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 min-[900px]:mx-6">
          {globalError}
        </div>
      )}

      {/* ── PC: 3-column layout ── */}
      <div className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:overflow-hidden min-[900px]:border-t min-[900px]:border-[#e8e6e0]">

        {/* Left: Basic info */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-r border-[#e8e6e0] px-6 py-5">
          <div className="mb-4 border-b border-[#e8e6e0] pb-3">
            <div className="mb-[3px] flex items-center gap-[7px] text-[15px] font-[600]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              基本情報
            </div>
            <p className="text-[12px] text-[#888]">募集のタイトルと内容を入力してください</p>
          </div>
          {basicFields}
        </div>

        {/* Middle: Conditions */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-r border-[#e8e6e0] px-6 py-5">
          <div className="mb-4 border-b border-[#e8e6e0] pb-3">
            <div className="mb-[3px] flex items-center gap-[7px] text-[15px] font-[600] text-[#888]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              日時・条件
            </div>
            <p className="text-[12px] text-[#888]">活動日時と参加条件を設定します</p>
          </div>
          {conditionFields}
        </div>

        {/* Right: Side panel */}
        <PcSidePanel form={form} onDraft={saveDraft} onCreate={createRecruitment} saving={saving} />
      </div>

      {/* ── Mobile: Step-based content ── */}
      <div className="min-[900px]:hidden">

        {/* Step 1: Basic info */}
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

        {/* Step 2: Conditions */}
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

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="px-[14px] py-[12px]">
            {/* Basic info summary */}
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
              <SRow label="説明" value={form.description.trim() ? form.description.trim().slice(0, 50) + (form.description.trim().length > 50 ? "…" : "") : "未入力"} empty={!form.description.trim()} />
              <SRow label="イベント" value={eventText ?? "未選択"} empty={!eventText} />
              <SRow label="役割" value={rolesText} />
            </div>

            {/* Conditions summary */}
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
              <SRow label="集合場所" value={form.meeting_place.trim() || "—"} empty={!form.meeting_place.trim()} />
              <SRow
                label="募集人数"
                value={form.capacity ? `${form.capacity}名まで` : "無制限"}
                empty={!form.capacity}
              />
              <SRow label="持ち物" value={form.items_to_bring.trim() || "—"} empty={!form.items_to_bring.trim()} />
              <SRow label="支給" value={form.provisions.trim() || "—"} empty={!form.provisions.trim()} />
            </div>

            {/* Validation error */}
            {hasErrors && (
              <div className="mb-[10px] flex gap-[8px] rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-[13px] py-[11px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8708A" strokeWidth="2" strokeLinecap="round" className="mt-[1px] shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="text-[11px] leading-[1.6] text-[#c04060]">
                  タイトルと説明が未入力です。作成するには必須項目を入力してください。
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile: Footer nav ── */}
      <div className="min-[900px]:hidden sticky bottom-0 z-10 border-t border-[#e8e6e0] bg-white px-[14px] pb-[14px] pt-[10px]">
        <div className="flex gap-[8px]">
          {step > 1 && (
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
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex flex-1 items-center justify-center gap-[5px] rounded-[10px] border-none py-[11px] text-[13px] font-[600] text-white"
              style={{ background: "#2B3A6B" }}
            >
              {nextLabel}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
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
              {saving === "create" ? "作成中…" : "作成する"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewRecruitmentPage() {
  return (
    <OrganizerRegistrationGate>
      <NewRecruitmentPageContent />
    </OrganizerRegistrationGate>
  );
}
