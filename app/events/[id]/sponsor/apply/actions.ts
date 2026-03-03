"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createSponsorApplication,
  getCompanyTierByEventAndId,
} from "@/lib/db/sponsors";

export type SubmitResult = { error?: string };

const applySchema = z.object({
  eventId: z.string().min(1, "イベントIDが必要です"),
  tierId: z.string().min(1, "協賛プランを選択してください"),
  companyName: z.string().min(1, "会社名は必須です").max(200),
  contactName: z.string().min(1, "担当者名は必須です").max(100),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().max(20).optional().or(z.literal("")),
  invoiceInfo: z.string().max(500).optional().or(z.literal("")),
  message: z.string().max(1000).optional().or(z.literal("")),
  logoUrl: z
    .string()
    .refine((v) => !v || v.startsWith("http"), "有効なURLを入力してください")
    .optional()
    .default(""),
});

export async function submitSponsorApplication(
  _prev: SubmitResult | null,
  formData: FormData
): Promise<SubmitResult> {
  const raw = {
    eventId: String(formData.get("eventId") ?? "").trim(),
    tierId: String(formData.get("tierId") ?? "").trim(),
    companyName: String(formData.get("companyName") ?? "").trim(),
    contactName: String(formData.get("contactName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: (formData.get("phone") as string)?.trim() ?? "",
    invoiceInfo: (formData.get("invoiceInfo") as string)?.trim() ?? "",
    message: (formData.get("message") as string)?.trim() ?? "",
    logoUrl: (formData.get("logoUrl") as string)?.trim() ?? "",
  };

  const parsed = applySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    return { error: first?.message ?? "入力内容を確認してください" };
  }

  const { eventId, tierId, companyName, contactName, email, phone, invoiceInfo, message, logoUrl } =
    parsed.data;

  const supabase = await createClient();
  if (!supabase) {
    return { error: "データベースに接続できません" };
  }

  const tier = await getCompanyTierByEventAndId(supabase, eventId, tierId);
  if (!tier) {
    return { error: "選択されたプランが無効です。ページを再読み込みしてください。" };
  }

  const application = await createSponsorApplication(supabase, {
    eventId,
    tierId,
    companyName,
    personName: contactName,
    email,
    phone: phone || undefined,
    invoiceInfo: invoiceInfo || undefined,
    message: message || undefined,
    logoUrl: logoUrl || undefined,
  });

  if (!application) {
    return { error: "申込の送信に失敗しました" };
  }

  redirect(`/events/${eventId}/sponsor/apply/thanks`);
}
