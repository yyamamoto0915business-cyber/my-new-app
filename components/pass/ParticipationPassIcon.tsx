type Props = {
  className?: string;
  /** アクティブ時などの塗り色。画像をマスクとして着色する */
  stroke?: string;
};

const PASS_ICON_SRC = "/assets/machiglyph/pass/pass-icon.png";

/** 参加パス（チケット風）アイコン — サイドバー・ヘッダー用 */
export function ParticipationPassIcon({
  className = "h-6 w-6",
  stroke = "currentColor",
}: Props) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        color: stroke,
        WebkitMaskImage: `url(${PASS_ICON_SRC})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${PASS_ICON_SRC})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
