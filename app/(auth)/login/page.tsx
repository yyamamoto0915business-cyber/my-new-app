import { redirect } from "next/navigation";

/** 認証入口は /auth に統一 */
export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw =
    params.returnTo ?? params.redirect ?? params.callbackUrl ?? params.next;
  const returnTo = Array.isArray(raw) ? raw[0] : raw;

  if (returnTo && typeof returnTo === "string" && returnTo.startsWith("/")) {
    redirect(`/auth?next=${encodeURIComponent(returnTo)}`);
  }
  redirect("/auth");
}
