/** マイアルバム（本型ステージ）の読み込みプレースホルダ */
export function MyPostsAlbumSkeleton() {
  return (
    <section
      className="my-album-stage my-album-stage--loading"
      aria-busy="true"
      aria-label="マイアルバムを読み込み中"
    >
      <div className="my-album-stage__toolbar my-album-stage-skeleton__toolbar">
        <div className="my-album-stage__brand">
          <div className="my-album-stage-skeleton__title" />
          <div className="my-album-stage-skeleton__lead" />
        </div>
        <div className="my-album-stage-skeleton__record" />
        <div className="my-album-stage-skeleton__filters" />
        <div className="my-album-stage-skeleton__count" />
      </div>
      <div className="my-album-stage-skeleton__scene" />
      <div className="my-album-stage-skeleton__film" />
      <div className="my-album-stage-skeleton__seasons" />
    </section>
  );
}
