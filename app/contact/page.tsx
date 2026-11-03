import type { Metadata } from "next";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";
import { ContactPageClient } from "@/components/contact/ContactPageClient";

export const metadata: Metadata = {
  title: "お問い合わせ - MachiGlyph",
  description: "ご質問・ご相談など、お気軽にお問い合わせください。",
};

/** App Store のサポート URL にもなっているので、ログインしていなくても開ける */
export default async function ContactPage() {
  const user = await getCachedAuthUser();
  return <ContactPageClient isGuest={!user} />;
}
