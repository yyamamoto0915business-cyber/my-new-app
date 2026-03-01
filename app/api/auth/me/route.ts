import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";

/** GET: 現在のログインユーザー */
export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}
