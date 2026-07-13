import { redirect } from "next/navigation";

/** 新規登録は /auth?tab=signup で表示 */
export default function SignupRedirectPage() {
  redirect("/auth?tab=signup");
}
