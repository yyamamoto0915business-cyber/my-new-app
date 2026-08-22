import { Suspense } from "react";
import { MyPostsHubClient } from "@/components/profile/posts/MyPostsHubClient";

type Props = { params: Promise<{ id: string }> };

export default async function UserAlbumPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <MyPostsHubClient authorId={id} />
    </Suspense>
  );
}
