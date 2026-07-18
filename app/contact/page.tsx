import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCachedAuthUser } from "@/lib/supabase/get-cached-auth-user";
import { ContactPageClient } from "@/components/contact/ContactPageClient";

export const metadata: Metadata = {
  title: "お問い合わせ - MachiGlyph",
  description: "ご質問・ご相談など、お気軽にお問い合わせください。",
};

export default async function ContactPage() {
  const user = await getCachedAuthUser();
  if (!user) {
    redirect("/auth?next=/contact");
  }

  return <ContactPageClient />;
}
