"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getLoginUrl } from "@/lib/auth-utils";
import {
  type ApplicationFormAnswers,
  type ApplicationFormConfig,
} from "@/lib/recruitment-application-form";
import {
  ApplicationFormPcView,
  type ApplicationFormProfile,
  type ApplicationFormRecruitmentSummary,
} from "@/components/recruitments/ApplicationFormPcView";
import { ApplicationFormMobileView } from "@/components/recruitments/ApplicationFormMobileView";

type FormPayload = {
  recruitment: ApplicationFormRecruitmentSummary;
  config: ApplicationFormConfig;
  requiredLabels: string[];
  application: {
    id: string;
    status: string;
    form_answers: ApplicationFormAnswers | null;
    form_completed_at: string | null;
    message: string | null;
  };
  profile: ApplicationFormProfile;
};

export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();
  const recruitmentId = params.id as string;
  const { user, loading: authLoading } = useSupabaseUser();

  const [data, setData] = useState<FormPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ApplicationFormAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loginHref = getLoginUrl(`/recruitments/${recruitmentId}/application-form`);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/recruitments/${recruitmentId}/application-form`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "フォームを取得できませんでした");
          return;
        }
        if (cancelled) return;
        setData(json as FormPayload);
        const initial: ApplicationFormAnswers = {
          ...(json.application?.form_answers ?? {}),
        };
        if (
          !initial.message &&
          typeof json.application?.message === "string" &&
          json.application.message
        ) {
          initial.message = json.application.message;
        }
        // プロフィールにあれば電話番号を初期値に（未入力時のみ）
        if (
          (!initial.phone || (typeof initial.phone === "string" && !initial.phone.trim())) &&
          typeof json.profile?.phone === "string" &&
          json.profile.phone.trim()
        ) {
          initial.phone = json.profile.phone.trim();
        }
        setAnswers(initial);
        if (json.application?.form_completed_at) {
          setSubmitted(true);
        }
      } catch {
        if (!cancelled) setError("フォームを取得できませんでした");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, recruitmentId]);

  const setField = (id: string, value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setDraftSaved(false);
  };

  const handleSaveDraft = async () => {
    if (!user || !data) return;
    setSavingDraft(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${recruitmentId}/application-form`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, draft: true }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "下書きの保存に失敗しました");
        return;
      }
      setDraftSaved(true);
    } catch {
      setError("下書きの保存に失敗しました");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !data) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${recruitmentId}/application-form`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "提出に失敗しました");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("提出に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 min-[900px]:max-w-xl">
        <p className="text-sm text-[#566358]">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 min-[900px]:max-w-xl">
        <p className="text-sm text-[#566358]">応募フォームの入力にはログインが必要です。</p>
        <Link
          href={loginHref}
          className="mt-4 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          ログインする
        </Link>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 min-[900px]:max-w-xl">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href={`/recruitments/${recruitmentId}`}
          className="mt-4 inline-flex text-sm font-medium text-[#2B3A6B] underline"
        >
          募集詳細へ戻る
        </Link>
      </div>
    );
  }

  if (!data) return null;

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 min-[900px]:max-w-xl">
        <div className="rounded-2xl border border-[#d8e5d4] bg-white p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--accent)]" strokeWidth={1.5} />
          <h1 className="mt-3 text-lg font-semibold text-[#1a2818]">応募フォームを提出しました</h1>
          <p className="mt-2 text-sm text-[#566358]">主催者からの連絡をお待ちください。</p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/recruitments/${recruitmentId}`}
              className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              募集詳細へ
            </Link>
            <Link
              href="/?kind=volunteer"
              className="rounded-xl border border-[#d8e5d4] bg-white px-4 py-3 text-sm font-medium text-[#2d4a28]"
            >
              まちの情報へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ApplicationFormPcView
        recruitmentId={recruitmentId}
        recruitment={data.recruitment}
        config={data.config}
        answers={answers}
        profile={data.profile}
        email={user.email}
        error={error}
        submitting={submitting}
        savingDraft={savingDraft}
        draftSaved={draftSaved}
        onChange={setField}
        onBack={() => router.back()}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />

      <ApplicationFormMobileView
        recruitment={data.recruitment}
        config={data.config}
        answers={answers}
        profile={data.profile}
        email={user.email}
        error={error}
        submitting={submitting}
        savingDraft={savingDraft}
        draftSaved={draftSaved}
        onChange={setField}
        onBack={() => router.back()}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />
    </>
  );
}
