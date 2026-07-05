/** モバイル認証画面の水彩イラスト背景（全画面・ヘッダー背面まで） */
export function AuthMobileBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 min-[900px]:hidden bg-[#fdfbf7]"
      aria-hidden
    >
      <div
        className="absolute inset-x-0 top-0 min-h-full"
        style={{
          backgroundImage: "url(/auth/login-bg.png)",
          backgroundSize: "100% auto",
          // イラストを上にずらし、町並み・塔がフォーム上にも見えるようにする
          backgroundPosition: "center -12vw",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
