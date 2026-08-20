import { MyPostsAlbumSkeleton } from "@/components/profile/posts/MyPostsAlbumSkeleton";

/** マイアルバム：ルート遷移中に本型UIと同じ見た目のスケルトンを即表示 */
export default function MyPostsLoading() {
  return (
    <div className="my-album-page my-album-page--book min-h-screen">
      <div className="my-album-shell">
        <div className="my-album-layout">
          <div className="my-album-feed">
            <MyPostsAlbumSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
