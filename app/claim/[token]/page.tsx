import type { Metadata } from "next";
import { ClaimPage } from "@/components/claim/ClaimPage";

export const metadata: Metadata = { title: "主催者ページの受け取り | MachiGlyph", robots: "noindex, nofollow" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ClaimPage token={token} />;
}
