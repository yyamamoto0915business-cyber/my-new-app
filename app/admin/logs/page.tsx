import { redirect } from "next/navigation";

export default function AdminLogsRedirect() {
  redirect("/admin/settings?tab=logs");
}
