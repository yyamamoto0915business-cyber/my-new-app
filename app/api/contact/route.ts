import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONTACT_BODY_MAX,
  CONTACT_CATEGORY_VALUES,
  CONTACT_GUEST_EMAIL_MAX,
  CONTACT_GUEST_NAME_MAX,
  CONTACT_SUBJECT_MAX,
} from "@/lib/contact";
import { checkGuestContactRateLimit } from "@/lib/contact-rate-limit";
import { getRequestIpFromHeaders } from "@/lib/signup-rate-limit";

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

/** ログインしていない人は、返信先の名前とメールアドレスも必要 */
const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください")
    .max(CONTACT_GUEST_NAME_MAX, `お名前は${CONTACT_GUEST_NAME_MAX}文字以内で入力してください`),
  email: z
    .string()
    .trim()
    .max(CONTACT_GUEST_EMAIL_MAX, "メールアドレスが長すぎます")
    .email("メールアドレスの形式が正しくありません"),
  // ボット対策（画面には出さない欄）。値が入っていたら送らない
  website: z.string().optional(),
});

const SEND_FAILED = "送信に失敗しました。しばらくしてからお試しください。";

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

  if (user) {
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
      return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  }

  const guest = guestSchema.safeParse(raw);
  if (!guest.success) {
    const first = guest.error.issues?.[0];
    return NextResponse.json(
      { error: first?.message ?? "入力内容を確認してください" },
      { status: 400 }
    );
  }
  if (guest.data.website) {
    return NextResponse.json({ ok: true });
  }

  const ip = getRequestIpFromHeaders(await headers());
  if (!checkGuestContactRateLimit(ip)) {
    return NextResponse.json(
      { error: "送信が多すぎます。しばらく時間をおいてから、もう一度お試しください。" },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
  }

  const { data, error } = await admin
    .from("contact_inquiries")
    .insert({
      user_id: null,
      guest_name: guest.data.name,
      guest_email: guest.data.email,
      category,
      subject,
      body,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[contact] guest insert failed:", error.message);
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
