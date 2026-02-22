import { NextResponse } from "next/server";
import { getAuth } from "@/lib/get-auth";
import { getThreadsForOrganizer, getThreadsForVolunteer } from "@/lib/dm-mock";
import { getUserById } from "@/lib/auth-users";

export async function GET(request: Request) {
  const session = await getAuth();
  const { searchParams } = new URL(request.url);
  const asOrganizer = searchParams.get("as") === "organizer";

  // 主催者: ログイン不要、未ログイン時は空配列
  if (asOrganizer) {
    const threads = session?.user?.id
      ? getThreadsForOrganizer(session.user.id)
      : [];
    const withPartner = threads.map((t) => {
      const partnerId =
        session!.user!.id === t.organizerId ? t.volunteerId : t.organizerId;
      const partner = getUserById(partnerId);
      return {
        ...t,
        partnerName: partner?.name ?? partner?.email ?? "ユーザー",
      };
    });
    return NextResponse.json(withPartner);
  }

  // ボランティア: ログイン必須
  if (!session?.user?.id) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const threads = getThreadsForVolunteer(session.user.id);

  const withPartner = threads.map((t) => {
    const partnerId =
      session.user!.id === t.organizerId ? t.volunteerId : t.organizerId;
    const partner = getUserById(partnerId);
    return {
      ...t,
      partnerName: partner?.name ?? partner?.email ?? "ユーザー",
    };
  });

  return NextResponse.json(withPartner);
}
