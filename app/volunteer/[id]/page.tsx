"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import { isRecruitmentRowId } from "@/lib/map-recruitment-to-volunteer-role";
import { VolunteerDetailPcView } from "@/components/volunteer/detail/VolunteerDetailPcView";
import { VolunteerDetailMobileView } from "@/components/volunteer/detail/VolunteerDetailMobileView";

export default function VolunteerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useSupabaseUser();
  const [role, setRole] = useState<VolunteerRoleWithEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [recruitmentId, setRecruitmentId] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWithTimeout(`/api/volunteer/roles/${id}`, undefined, 15_000)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then(async (data: VolunteerRoleWithEvent) => {
        if (cancelled) return;
        setRole(data);
        const resolvedRecruitmentId =
          data.recruitmentId ?? (isRecruitmentRowId(id) ? id : null);
        setRecruitmentId(resolvedRecruitmentId);

        const oid = data.organizerId;
        if (!oid) return;
        try {
          const orgRes = await fetchWithTimeout(
            `/api/organizers/${oid}/public`,
            undefined,
            8_000
          );
          if (!orgRes.ok || cancelled) return;
          const org = await orgRes.json();
          if (cancelled) return;
          setRole((prev) =>
            prev
              ? {
                  ...prev,
                  organizerName: org.organizerName ?? prev.organizerName,
                  organizerAvatarUrl:
                    org.organizerAvatarUrl ?? prev.organizerAvatarUrl,
                  organizerBio: org.organizerBio ?? prev.organizerBio,
                  organizerRegion: org.organizerRegion ?? prev.organizerRegion,
                }
              : prev
          );
        } catch {
          /* 主催者情報は任意 */
        }
      })
      .catch(() => {
        if (!cancelled) setError("募集が見つかりません");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!user || !recruitmentId) return;
    fetchWithTimeout(`/api/recruitments/${recruitmentId}/my-status`)
      .then((r) => r.json())
      .then((data) => setApplicationStatus(data?.status ?? null))
      .catch(() => setApplicationStatus(null));
  }, [user, recruitmentId]);

  const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

  const handleApply = async () => {
    if (!role) return;
    if (!user && !authDisabled) {
      router.push(`/auth?next=${encodeURIComponent(`/volunteer/${id}`)}`);
      return;
    }
    setApplying(true);
    setApplyError(null);
    setApplySuccessMessage(null);
    try {
      const res = await fetchWithTimeout("/api/volunteer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerRoleId: role.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (!res.ok) {
        if (data.status) setApplicationStatus(data.status);
        if (data.recruitmentId) setRecruitmentId(data.recruitmentId);
        setApplyError(data.error ?? "応募に失敗しました");
        return;
      }
      setApplicationStatus(data.status ?? "pending");
      if (data.recruitmentId) setRecruitmentId(data.recruitmentId);
      if (data.formRequired && data.formUrl) {
        router.push(data.formUrl as string);
        return;
      }
      setApplySuccessMessage(
        data.message ?? "応募を受け付けました。主催者の確認をお待ちください。"
      );
    } catch {
      setApplyError("通信に失敗しました");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8F5]">
        <p className="text-[13px] text-[#566358]">読み込み中...</p>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F5F8F5]">
        <p className="text-[13px] text-red-600">{error ?? "募集が見つかりません"}</p>
        <Link href="/volunteer" className="text-[13px] text-[#2D7A4F] underline">
          一覧に戻る
        </Link>
      </div>
    );
  }

  const isEmergency = role.emergency?.isEmergency === true;
  const locationValue =
    isEmergency && !user && !authDisabled ? "ログインすると表示します" : role.location;

  const sharedProps = {
    role,
    roleId: id,
    locationValue,
    applying,
    applyError,
    applySuccessMessage,
    applicationStatus,
    onApply: handleApply,
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5]">
      <VolunteerDetailPcView
        {...sharedProps}
        saved={saved}
        onToggleSaved={() => setSaved((v) => !v)}
      />
      <VolunteerDetailMobileView {...sharedProps} />
    </div>
  );
}
