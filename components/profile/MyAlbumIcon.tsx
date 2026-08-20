type Props = {
  className?: string;
  stroke?: string;
};

/** マイアルバム（見開きの本）アイコン — ナビ用 */
export function MyAlbumIcon({
  className = "h-6 w-6",
  stroke = "currentColor",
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* 表紙 */}
      <path d="M5.2 6.3H3.8A1.4 1.4 0 0 0 2.4 7.7V18.2A1.4 1.4 0 0 0 3.8 19.6H20.2A1.4 1.4 0 0 0 21.6 18.2V7.7A1.4 1.4 0 0 0 20.2 6.3H18.8" />
      {/* 左ページ */}
      <path d="M12 6.3C10.2 5.2 8 4.7 6.4 4.7A1.2 1.2 0 0 0 5.2 5.9V15.1A1.2 1.2 0 0 0 6.4 16.3C8 16.3 10.2 16.7 12 17.3Z" />
      {/* 右ページ */}
      <path d="M12 6.3C13.8 5.2 16 4.7 17.6 4.7A1.2 1.2 0 0 1 18.8 5.9V15.1A1.2 1.2 0 0 1 17.6 16.3C16 16.3 13.8 16.7 12 17.3Z" />
    </svg>
  );
}
