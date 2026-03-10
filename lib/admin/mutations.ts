/**
 * 管理画面 更新系
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type GrantResult = {
  success: boolean;
  message: string;
  subscription?: Record<string, unknown>;
};

export async function grantOrganizerPlan(
  supabase: SupabaseClient,
  params: {
    organizerId: string;
    grantType: "30_days" | "90_days" | "unlimited";
    reason?: string;
    adminUserId: string;
  }
): Promise<GrantResult> {
  const { organizerId, grantType, reason, adminUserId } = params;

  try {
    if (grantType === "unlimited") {
      const { error } = await supabase.rpc("grant_organizer_plan_unlimited", {
        p_target_organizer_id: organizerId,
        p_reason: reason ?? null,
        p_admin_user_id: adminUserId,
      });
      if (error) {
        return {
          success: false,
          message: error.message ?? "付与に失敗しました",
        };
      }
    } else {
      const days = grantType === "30_days" ? 30 : 90;
      const { error } = await supabase.rpc("grant_organizer_plan", {
        p_target_organizer_id: organizerId,
        p_grant_days: days,
        p_reason: reason ?? null,
        p_admin_user_id: adminUserId,
      });
      if (error) {
        return {
          success: false,
          message: error.message ?? "付与に失敗しました",
        };
      }
    }

    const label =
      grantType === "30_days"
        ? "30日"
        : grantType === "90_days"
        ? "90日"
        : "無期限";
    return {
      success: true,
      message: `${label}の有料プランを付与しました`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "付与に失敗しました";
    return { success: false, message: msg };
  }
}

export async function revokeOrganizerGrant(
  supabase: SupabaseClient,
  params: {
    organizerId: string;
    reason?: string;
    adminUserId: string;
  }
): Promise<GrantResult> {
  const { organizerId, reason, adminUserId } = params;

  try {
    const { error } = await supabase.rpc("revoke_manual_grant", {
      p_target_organizer_id: organizerId,
      p_reason: reason ?? null,
      p_admin_user_id: adminUserId,
    });
    if (error) {
      return {
        success: false,
        message: error.message ?? "取り消しに失敗しました",
      };
    }
    return {
      success: true,
      message: "手動付与を取り消しました",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "取り消しに失敗しました";
    return { success: false, message: msg };
  }
}

export async function updateOrganizerGrantReason(
  supabase: SupabaseClient,
  params: {
    organizerId: string;
    reason: string;
    adminUserId: string;
  }
): Promise<{ success: boolean; message: string }> {
  const { organizerId, reason, adminUserId } = params;

  const { data: before } = await supabase
    .from("organizer_plan_state")
    .select("*")
    .eq("organizer_id", organizerId)
    .single();

  if (!before) {
    const { error: insertErr } = await supabase
      .from("organizer_plan_state")
      .insert({
        organizer_id: organizerId,
        grant_reason: reason,
        updated_by_admin: adminUserId,
      });
    if (insertErr) {
      return {
        success: false,
        message: insertErr.message ?? "理由の保存に失敗しました",
      };
    }
  } else {
    const { error } = await supabase
      .from("organizer_plan_state")
      .update({
        grant_reason: reason,
        updated_by_admin: adminUserId,
      })
      .eq("organizer_id", organizerId);

    if (error) {
      return {
        success: false,
        message: error.message ?? "理由の保存に失敗しました",
      };
    }
  }

  const { data: after } = await supabase
    .from("organizer_plan_state")
    .select("*")
    .eq("organizer_id", organizerId)
    .single();

  await supabase.from("admin_logs").insert({
    admin_user_id: adminUserId,
    target_organizer_id: organizerId,
    action_type: "update_reason",
    reason,
    before_value: before ?? {},
    after_value: after ?? {},
  });

  return { success: true, message: "理由を保存しました" };
}

export async function addOrganizerNote(
  supabase: SupabaseClient,
  params: {
    organizerId: string;
    note: string;
    adminUserId: string;
  }
): Promise<{ success: boolean; message: string }> {
  const { organizerId, note, adminUserId } = params;

  const { error } = await supabase.from("organizer_notes").insert({
    organizer_id: organizerId,
    note,
    created_by: adminUserId,
  });

  if (error) {
    return {
      success: false,
      message: error.message ?? "メモの追加に失敗しました",
    };
  }

  return { success: true, message: "メモを追加しました" };
}
