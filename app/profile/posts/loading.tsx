import { MyAlbumProfileSkeleton } from "@/components/profile/posts/MyAlbumProfileHeader";

/** マイアルバム：ルート遷移中に新しいハブと同じ骨格を出す */
export default function MyPostsLoading() {
  return (
    <div className="mg-album-hub my-album-page min-h-screen">
      <div className="my-album-shell">
        <MyAlbumProfileSkeleton />
        <div className="mg-album-grid" style={{ padding: "0 12px 24px" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mg-album-tile is-skeleton">
              <div className="mg-album-tile__photo" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
