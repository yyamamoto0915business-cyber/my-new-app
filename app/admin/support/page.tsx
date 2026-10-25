import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminFilterBar, AdminSearchInput } from "@/components/admin/AdminFilterBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import {
  contactCategoryLabel,
  contactStatusLabel,
} from "@/lib/contact";
import { AdminReportActions } from "@/components/admin/AdminReportActions";
import { REPORT_REASON_LABELS, type ReportReason } from "@/lib/db/moderation";

type InquiryRow = {
  id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  user_id: string;
  profile: { display_name: string | null; email: string | null } | null;
};

function statusTone(status: string) {
  if (status === "closed") return "neutral" as const;
  if (status === "in_progress") return "info" as const;
  return "warning" as const;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "reports" ? "reports" : "inquiries";
  const q = sp.q?.trim() ?? "";
  const statusFilter = sp.status ?? "all";

  const tabs = [
    {
      id: "inquiries",
      label: "お問い合わせ",
      href: "/admin/support?tab=inquiries",
    },
    {
      id: "reports",
      label: "通報・報告",
      href: "/admin/support?tab=reports",
    },
  ];

  if (tab === "reports") {
    return (
      <div>
        <AdminPageHeader
          title="問い合わせ・通報"
          description="ユーザーからの問い合わせと通報を確認・対応できます。通報は24時間以内に対応してください。"
        />
        <AdminTabs tabs={tabs} activeId="reports" />
        <AdminReportsList showAll={statusFilter === "all_reports"} />
      </div>
    );
  }

  const adminSupabase = createAdminClient();
  const supabase = adminSupabase ?? (await createClient());
  if (!supabase) {
    return (
      <AdminPageHeader
        title="問い合わせ・通報"
        description="Supabase が未設定のため表示できません。"
      />
    );
  }

  const [listRes, openRes, progressRes, closedRes, openReportsRes] = await Promise.all([
    supabase
      .from("contact_inquiries")
      .select(
        `
        id,
        category,
        subject,
        status,
        created_at,
        user_id,
        profile:user_id ( display_name, email )
      `
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("contact_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
    supabase
      .from("content_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  let rows = (listRes.data ?? []) as unknown as InquiryRow[];
  if (statusFilter !== "all") {
    rows = rows.filter((r) => r.status === statusFilter);
  }
  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.subject.toLowerCase().includes(lower) ||
        r.profile?.display_name?.toLowerCase().includes(lower) ||
        r.profile?.email?.toLowerCase().includes(lower)
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="問い合わせ・通報"
        description="ユーザーからの問い合わせと通報を確認・対応できます。"
      />
      <AdminTabs tabs={tabs} activeId="inquiries" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="未対応"
          value={openRes.count ?? 0}
          tone="warning"
        />
        <AdminStatCard
          label="対応中"
          value={progressRes.count ?? 0}
          tone="info"
        />
        <AdminStatCard label="完了" value={closedRes.count ?? 0} tone="success" />
        <AdminStatCard label="未対応の通報" value={openReportsRes.count ?? 0} tone="danger" />
      </div>

      <AdminFilterBar action="/admin/support">
        <input type="hidden" name="tab" value="inquiries" />
        <AdminSearchInput
          defaultValue={q}
          placeholder="件名・送信者名・メール"
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="h-10 rounded-lg border border-[#c8dcd0] bg-white px-3 text-sm"
        >
          <option value="all">すべての状態</option>
          <option value="open">未対応</option>
          <option value="in_progress">対応中</option>
          <option value="closed">完了</option>
        </select>
      </AdminFilterBar>

      {listRes.error ? (
        <p className="text-sm text-red-700">{listRes.error.message}</p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="お問い合わせはまだありません"
          description="ユーザーが /contact から送信すると、ここに表示されます。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">受付日時</th>
                <th className="px-4 py-3 text-left font-medium">件名</th>
                <th className="px-4 py-3 text-left font-medium">区分</th>
                <th className="px-4 py-3 text-left font-medium">送信者</th>
                <th className="px-4 py-3 text-left font-medium">状態</th>
                <th className="px-4 py-3 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#eef4f0] last:border-0"
                >
                  <td className="px-4 py-3.5 text-[#7a9888]">
                    {new Date(row.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-[#0e1610]">
                    {row.subject}
                  </td>
                  <td className="px-4 py-3.5 text-[#5a7868]">
                    {contactCategoryLabel(row.category)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div>{row.profile?.display_name ?? "—"}</div>
                    <div className="text-[11px] text-[#7a9888]">
                      {row.profile?.email ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminStatusBadge tone={statusTone(row.status)}>
                      {contactStatusLabel(row.status)}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/inquiries/${row.id}`}
                      className="text-xs font-medium text-[#1e3848] hover:underline"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type ReportRow = {
  id: string;
  target_type: "post" | "comment" | "user";
  target_id: string;
  target_user_id: string | null;
  reason: string;
  detail: string;
  status: "open" | "hidden" | "dismissed";
  created_at: string;
  reporter: { display_name: string | null } | null;
  target_user: { display_name: string | null } | null;
};

const REPORT_TARGET_LABELS = { post: "投稿", comment: "コメント", user: "ユーザー" } as const;
const REPORT_STATUS_LABELS = { open: "未対応", hidden: "非表示にした", dismissed: "問題なし" } as const;

async function AdminReportsList({ showAll }: { showAll: boolean }) {
  const supabase = createAdminClient() ?? (await createClient());
  if (!supabase) {
    return <p className="text-sm text-red-700">Supabase が未設定のため表示できません。</p>;
  }

  let query = supabase
    .from("content_reports")
    .select(
      `
      id, target_type, target_id, target_user_id, reason, detail, status, created_at,
      reporter:reporter_id ( display_name ),
      target_user:target_user_id ( display_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (!showAll) query = query.eq("status", "open");
  const { data, error } = await query;

  if (error) {
    return (
      <AdminEmptyState
        title="通報を読み込めませんでした"
        description={`通報用のテーブル（content_reports）が本番データベースにあるか確認してください。${error.message}`}
      />
    );
  }
  const rows = (data ?? []) as unknown as ReportRow[];

  // 通報された投稿・コメントの中身を表示用に取ってくる
  const postIds = rows.filter((r) => r.target_type === "post").map((r) => r.target_id);
  const commentIds = rows.filter((r) => r.target_type === "comment").map((r) => r.target_id);
  const [postsRes, commentsRes] = await Promise.all([
    postIds.length
      ? supabase.from("community_posts").select("id, title, body, status").in("id", postIds)
      : Promise.resolve({ data: [] as { id: string; title: string; body: string; status: string }[] }),
    commentIds.length
      ? supabase
          .from("community_post_comments")
          .select("id, post_id, body, status")
          .in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; post_id: string; body: string; status: string }[] }),
  ]);
  const posts = new Map(
    ((postsRes.data ?? []) as { id: string; title: string; body: string; status: string }[]).map(
      (p) => [p.id, p],
    ),
  );
  const comments = new Map(
    (
      (commentsRes.data ?? []) as { id: string; post_id: string; body: string; status: string }[]
    ).map((c) => [c.id, c]),
  );

  function preview(row: ReportRow) {
    if (row.target_type === "post") {
      const post = posts.get(row.target_id);
      if (!post) return { text: "（削除済み）", href: null, hidden: false };
      return {
        text: [post.title, post.body].filter(Boolean).join(" — "),
        href: `/posts/${post.id}`,
        hidden: post.status === "hidden",
      };
    }
    if (row.target_type === "comment") {
      const comment = comments.get(row.target_id);
      if (!comment) return { text: "（削除済み）", href: null, hidden: false };
      return {
        text: comment.body,
        href: `/posts/${comment.post_id}`,
        hidden: comment.status === "hidden",
      };
    }
    return {
      text: row.target_user?.display_name ?? "ユーザー",
      href: `/users/${row.target_id}/album`,
      hidden: false,
    };
  }

  return (
    <>
      <div className="mb-3 flex gap-3 text-xs">
        <Link
          href="/admin/support?tab=reports"
          className={showAll ? "text-[#7a9888] hover:underline" : "font-semibold text-[#0e1610]"}
        >
          未対応のみ
        </Link>
        <Link
          href="/admin/support?tab=reports&status=all_reports"
          className={showAll ? "font-semibold text-[#0e1610]" : "text-[#7a9888] hover:underline"}
        >
          すべて
        </Link>
      </div>
      {rows.length === 0 ? (
        <AdminEmptyState
          title={showAll ? "通報はまだありません" : "未対応の通報はありません"}
          description="ユーザーが投稿・コメント・ユーザーを通報すると、ここに表示されます。"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d8e8dc] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e0ece4] bg-[#f4faf6] text-[11px] uppercase text-[#7a9888]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">受付日時</th>
                <th className="px-4 py-3 text-left font-medium">対象</th>
                <th className="px-4 py-3 text-left font-medium">内容</th>
                <th className="px-4 py-3 text-left font-medium">理由</th>
                <th className="px-4 py-3 text-left font-medium">通報した人</th>
                <th className="px-4 py-3 text-left font-medium">状態</th>
                <th className="px-4 py-3 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const p = preview(row);
                return (
                  <tr key={row.id} className="border-b border-[#eef4f0] align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#7a9888]">
                      {new Date(row.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {REPORT_TARGET_LABELS[row.target_type]}
                      <div className="text-[11px] text-[#7a9888]">
                        {row.target_user?.display_name ?? "—"}
                      </div>
                    </td>
                    <td className="max-w-[320px] px-4 py-3.5">
                      {p.href ? (
                        <Link href={p.href} target="_blank" className="line-clamp-3 hover:underline">
                          {p.text}
                        </Link>
                      ) : (
                        <span className="text-[#7a9888]">{p.text}</span>
                      )}
                      {p.hidden ? (
                        <div className="mt-1 text-[11px] text-red-700">非表示中</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5">
                      {REPORT_REASON_LABELS[row.reason as ReportReason] ?? row.reason}
                      {row.detail ? (
                        <div className="mt-1 max-w-[240px] text-[11px] text-[#5a7868]">
                          {row.detail}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {row.reporter?.display_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <AdminStatusBadge
                        tone={
                          row.status === "open"
                            ? "warning"
                            : row.status === "hidden"
                              ? "danger"
                              : "neutral"
                        }
                      >
                        {REPORT_STATUS_LABELS[row.status]}
                      </AdminStatusBadge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {row.status === "open" ? (
                        <AdminReportActions
                          reportId={row.id}
                          canHide={row.target_type !== "user"}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
