import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloperAdmin } from "@/lib/auth/admin";
import { revokeOrganizerGrant } from "@/lib/admin/mutations";
import {
  organizerIdParamSchema,
  revokeActionBodySchema,
} from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDeveloperAdmin();
  if (!auth.ok) {
    return NextResponse.json(
      err(
        auth.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
        auth.status === 401 ? "ログインが必要です" : "開発者権限が必要です"
      ),
      { status: auth.status }
    );
  }

  const paramParsed = organizerIdParamSchema.safeParse(await params);
  if (!paramParsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "organizer ID が不正です", paramParsed.error.flatten()),
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const bodyParsed = revokeActionBodySchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "リクエストが不正です", bodyParsed.error.flatten()),
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const result = await revokeOrganizerGrant(supabase, {
    organizerId: paramParsed.data.id,
    reason: bodyParsed.data.reason,
    adminUserId: auth.profile.id,
  });

  if (!result.success) {
    return NextResponse.json(
      err("INTERNAL_ERROR", result.message),
      { status: 500 }
    );
  }

  return NextResponse.json(
    ok({
      success: true,
      message: result.message,
      toast: result.message,
    })
  );
}
