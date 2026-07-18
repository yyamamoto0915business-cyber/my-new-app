import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONTACT_STATUS_VALUES,
  contactCategoryLabel,
  contactStatusLabel,
  type ContactStatus,
} from "@/lib/contact";
import { AdminInquiryActions } from "@/components/admin/AdminInquiryActions";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUS_VALUES as string[]).includes(value);
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">お問い合わせ詳細</h2>
        <p className="text-sm text-slate-500">
          Supabase が未設定のため、詳細を表示できません。
        </p>
      </div>
    );
  }

  const { id } = await params;
  const isUuid =
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    );
  if (!isUuid) {
    redirect("/admin/inquiries");
  }

  const { data, error } = await supabase
    .from("contact_inquiries")
    .select(
      `
      id,
      category,
      subject,
      body,
      status,
      admin_note,
      created_at,
      updated_at,
      user_id,
      profile:user_id ( display_name, email )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/inquiries"
          className="text-sm text-sky-700 hover:underline"
        >
          ← 一覧へ戻る
        </Link>
        <p className="text-sm text-slate-500">
          お問い合わせが見つかりませんでした。
        </p>
      </div>
    );
  }

  const profileRaw = data.profile as
    | { display_name: string | null; email: string | null }
    | { display_name: string | null; email: string | null }[]
    | null;
  const profile = Array.isArray(profileRaw)
    ? profileRaw[0] ?? null
    : profileRaw;

  const status = isContactStatus(data.status) ? data.status : "open";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/inquiries"
          className="text-sm text-sky-700 hover:underline"
        >
          ← 一覧へ戻る
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          お問い合わせ詳細
        </h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">受信日時</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {formatDate(data.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">状態</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {contactStatusLabel(status)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">ユーザー</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {profile?.display_name || "（名前なし）"}
            </dd>
            <dd className="text-xs text-slate-500">{profile?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">カテゴリ</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {contactCategoryLabel(data.category)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-xs font-medium text-slate-500">件名</h3>
          <p className="mt-1 text-[15px] font-medium text-slate-900">
            {data.subject}
          </p>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-medium text-slate-500">本文</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-[1.8] text-slate-800">
            {data.body}
          </p>
        </div>
      </section>

      <AdminInquiryActions
        inquiryId={data.id}
        initialStatus={status}
        initialAdminNote={data.admin_note ?? ""}
      />
    </div>
  );
}
