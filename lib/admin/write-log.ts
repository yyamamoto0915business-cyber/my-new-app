/**
 * 管理者操作の監査ログ書き込みヘルパ
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminLogInput = {
  adminUserId: string;
  adminEmail?: string | null;
  actionType: string;
  targetOrganizerId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  beforeValue?: unknown;
  afterValue?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  result?: string;
};

export async function writeAdminLog(
  supabase: SupabaseClient,
  input: AdminLogInput
): Promise<void> {
  const row: Record<string, unknown> = {
    admin_user_id: input.adminUserId,
    admin_email: input.adminEmail ?? null,
    target_organizer_id: input.targetOrganizerId ?? null,
    action_type: input.actionType,
    before_value: input.beforeValue ?? null,
    after_value: input.afterValue ?? null,
    reason: input.reason ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      ...(input.targetType
        ? { target_type: input.targetType, target_id: input.targetId }
        : {}),
    },
  };

  // 拡張カラムがある環境向け（未適用マイグレーションでも落ちないよう try）
  if (input.targetType) row.target_type = input.targetType;
  if (input.targetId) row.target_id = input.targetId;
  if (input.ipAddress) row.ip_address = input.ipAddress;
  if (input.userAgent) row.user_agent = input.userAgent;
  if (input.result) row.result = input.result;

  const { error } = await supabase.from("admin_logs").insert(row);
  if (error) {
    console.error("[writeAdminLog]", error.message);
  }
}
