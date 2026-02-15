import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserPoints(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("user_points")
    .select("balance")
    .eq("user_id", userId)
    .single();
  return data?.balance ?? 0;
}

export async function addPoints(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  type: "earn" | "spend" | "exchange",
  referenceId?: string
) {
  const { data: current } = await supabase
    .from("user_points")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const balance = (current?.balance ?? 0) + amount;
  await supabase.from("user_points").upsert(
    { user_id: userId, balance, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  await supabase.from("point_transactions").insert({
    user_id: userId,
    amount,
    type,
    reference_id: referenceId ?? null,
  });
}
