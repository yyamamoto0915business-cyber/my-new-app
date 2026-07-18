import { redirect } from "next/navigation";

export default function AdminOthersRedirect() {
  redirect("/admin/accounts?tab=users");
}
