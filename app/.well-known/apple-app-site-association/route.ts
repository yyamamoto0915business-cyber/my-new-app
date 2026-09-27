import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** iOS の Universal Link。APPLE_TEAM_ID が入るとアプリが /auth/callback を受け取れる。 */
export function GET() {
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const appId = teamId ? `${teamId}.jp.machiglyph.app` : null;
  const body = {
    applinks: {
      apps: [] as string[],
      details: appId
        ? [
            {
              appIDs: [appId],
              components: [{ "/": "/auth/callback*" }],
            },
          ]
        : [],
    },
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
