import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDeveloperAdminContext } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "MachiGlyph 開発者管理画面",
  robots: "noindex, nofollow",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getDeveloperAdminContext();
  if (!admin) {
    redirect("/forbidden");
  }

  return (
    <AdminShell adminEmail={admin.email} adminRole={admin.role}>
      {children}
    </AdminShell>
  );
}

