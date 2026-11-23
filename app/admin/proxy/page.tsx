import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminProxyOrganizers } from "@/components/admin/AdminProxyOrganizers";

export default function Page() {
  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="代わりに掲載"
        description="お店・主催者の代わりに主催者ページを作り、受け取りリンクで渡します。パスワードのやりとりはいりません。"
      />
      <AdminProxyOrganizers />
    </div>
  );
}
