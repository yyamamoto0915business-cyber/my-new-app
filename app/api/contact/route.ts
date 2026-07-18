import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  CONTACT_BODY_MAX,
  CONTACT_CATEGORY_VALUES,
  CONTACT_SUBJECT_MAX,
} from "@/lib/contact";

const contactSchema = z.object({
  category: z.enum(CONTACT_CATEGORY_VALUES),
  subject: z
    .string()
    .trim()
    .min(1, "件名を入力してください")
    .max(CONTACT_SUBJECT_MAX, `件名は${CONTACT_SUBJECT_MAX}文字以内で入力してください`),
  body: z
    .string()
    .trim()
    .min(1, "お問い合わせ内容を入力してください")
    .max(CONTACT_BODY_MAX, `本文は${CONTACT_BODY_MAX}文字以内で入力してください`),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "データベースに接続できません" },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues?.[0];
    return NextResponse.json(
      { error: first?.message ?? "入力内容を確認してください" },
      { status: 400 }
    );
  }

  const { category, subject, body } = parsed.data;

  const { data, error } = await supabase
    .from("contact_inquiries")
    .insert({
      user_id: user.id,
      category,
      subject,
      body,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[contact] insert failed:", error.message);
    return NextResponse.json(
      { error: "送信に失敗しました。しばらくしてからお試しください。" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
