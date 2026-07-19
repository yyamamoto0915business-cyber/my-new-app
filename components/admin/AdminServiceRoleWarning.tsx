import { createAdminClient } from "@/lib/supabase/admin";

/** Service Role が無いと profiles 横断読取ができず件数がずれる */
export function AdminServiceRoleWarning() {
  const hasServiceRole = Boolean(createAdminClient());
  if (hasServiceRole) return null;

  return (
    <div
      role="status"
      className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-900"
    >
      <strong className="font-semibold">注意:</strong>{" "}
      <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
      が未設定のため、ユーザー件数など一部の集計が不完全になる可能性があります。Vercel
      の Environment Variables に設定後、再デプロイしてください。
    </div>
  );
}
