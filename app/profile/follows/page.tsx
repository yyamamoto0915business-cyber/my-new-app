import { Suspense } from "react";
import { FollowsPageClient } from "@/components/profile/FollowsPageClient";

export default function ProfileFollowsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={null}>
        <FollowsPageClient />
      </Suspense>
    </div>
  );
}
