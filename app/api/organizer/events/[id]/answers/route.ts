import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiUser } from "@/lib/api-auth";
import { getOrganizerIdByProfileId } from "@/lib/db/recruitments-mvp";
import { getOrganizerIdByEventId } from "@/lib/db/events";
import { formatEventAnswers, sanitizeEventQuestions } from "@/lib/event-questions";

type Params = { params: Promise<{ id: string }> };

type ParticipantRow = {
  id: string;
  status: string;
  created_at: string;
  answers: unknown;
  profiles: { display_name?: string | null } | { display_name?: string | null }[] | null;
};

function displayName(p: ParticipantRow["profiles"]): string {
  const profile = Array.isArray(p) ? p[0] : p;
  return profile?.display_name?.trim() || "名前なし";
}

/** GET: 申し込んだ人と、申し込みの質問への答え（主催者だけ） */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getApiUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "DB未設定" }, { status: 503 });

  const organizerId = await getOrganizerIdByProfileId(supabase, user.id);
  const eventOrganizerId = await getOrganizerIdByEventId(supabase, id);
  if (!organizerId || eventOrganizerId !== organizerId) {
    return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  }

  const [{ data: event }, participantsRes] = await Promise.all([
    supabase.from("events").select("id, title, date, application_questions").eq("id", id).maybeSingle(),
    supabase
      .from("event_participants")
      .select("id, status, created_at, answers, profiles(display_name)")
      .eq("event_id", id)
      .order("created_at", { ascending: true })
      .limit(1000),
  ]);
  if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });
  if (participantsRes.error) {
    console.error("event answers GET:", participantsRes.error);
    return NextResponse.json({ error: "申し込みの取得に失敗しました" }, { status: 500 });
  }

  const questions = sanitizeEventQuestions(event.application_questions);
  const participants = ((participantsRes.data ?? []) as unknown as ParticipantRow[]).map((row) => ({
    id: row.id,
    name: displayName(row.profiles),
    status: row.status,
    createdAt: row.created_at,
    answers: formatEventAnswers(questions, row.answers),
    rawAnswers:
      row.answers && typeof row.answers === "object" && !Array.isArray(row.answers)
        ? (row.answers as Record<string, string>)
        : {},
  }));

  return NextResponse.json({
    event: { id: event.id, title: event.title, date: event.date },
    questions,
    participants,
  });
}
