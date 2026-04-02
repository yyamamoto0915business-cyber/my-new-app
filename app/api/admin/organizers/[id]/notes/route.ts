import { NextRequest, NextResponse } from "next/server";
import { requireDeveloperAdminWithSupabase } from "@/lib/auth/admin";
import { getAdminOrganizerDetail } from "@/lib/admin/queries";
import { addOrganizerNote } from "@/lib/admin/mutations";
import { organizerIdParamSchema, notesSchema } from "@/lib/admin/validators";
import { ok, err } from "@/lib/admin/dto";
import { createRouteSupabaseClient } from "@/lib/supabase/route";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = NextResponse.next();
  const supabase = createRouteSupabaseClient(req, response);
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const auth = await requireDeveloperAdminWithSupabase(supabase);
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

  const detail = await getAdminOrganizerDetail(supabase, paramParsed.data.id);
  if (!detail) {
    return NextResponse.json(
      err("NOT_FOUND", "主催者が見つかりません"),
      { status: 404 }
    );
  }

  return NextResponse.json(ok({ notes: detail.notes }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const response = NextResponse.next();
  const supabase = createRouteSupabaseClient(req, response);
  if (!supabase) {
    return NextResponse.json(
      err("INTERNAL_ERROR", "Supabase が設定されていません"),
      { status: 500 }
    );
  }

  const auth = await requireDeveloperAdminWithSupabase(supabase);
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
  const bodyParsed = notesSchema.safeParse(body);
  if (!bodyParsed.success) {
    return NextResponse.json(
      err("VALIDATION_ERROR", "リクエストが不正です", bodyParsed.error.flatten()),
      { status: 400 }
    );
  }

  const result = await addOrganizerNote(supabase, {
    organizerId: paramParsed.data.id,
    note: bodyParsed.data.note,
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
