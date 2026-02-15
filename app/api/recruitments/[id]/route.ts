import { NextResponse } from "next/server";
import { mockRecruitments } from "../../../../lib/recruitments-mock";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const recruitment = mockRecruitments.find((r) => r.id === id);
  if (!recruitment) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(recruitment);
}
