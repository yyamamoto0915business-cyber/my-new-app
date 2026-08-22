import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { fetchRelatedLinkPreview } from "@/lib/posts/link-preview";
import { classifyRelatedHref } from "@/lib/posts/related-link";

export async function POST(request: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }

  const url = String((body as Record<string, unknown>).url ?? "").trim();
  if (!url) {
    return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
  }
  if (url.startsWith("/")) {
    return NextResponse.json({
      url,
      kind: classifyRelatedHref(url),
      title: "",
      imageUrl: "",
      siteName: "",
    });
  }

  const preview = await fetchRelatedLinkPreview(url);
  if (!preview) {
    return NextResponse.json({ error: "プレビューを取得できません" }, { status: 400 });
  }
  return NextResponse.json(preview);
}
