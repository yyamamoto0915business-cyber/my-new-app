import type { Metadata } from "next";
import { TeamJoinPage } from "@/components/team/TeamJoinPage";

export const metadata: Metadata = {
  title: "チームへの招待 | MachiGlyph",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TeamJoinPage token={token} />;
}
