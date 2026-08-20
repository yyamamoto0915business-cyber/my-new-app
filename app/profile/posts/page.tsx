import { Suspense } from "react";
import { MyPostsHubClient } from "@/components/profile/posts/MyPostsHubClient";

export default function MyPostsPage() {
  return (
    <Suspense fallback={null}>
      <MyPostsHubClient />
    </Suspense>
  );
}
