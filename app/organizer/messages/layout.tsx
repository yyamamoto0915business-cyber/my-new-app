import MessagesLayout from "@/app/messages/layout";

/**
 * 主催者のチャット（主催者として参加している会話だけ）。中身は /messages と同じ部品で、URL で主催者用に切り替える。
 * 主催者の画面の main には周りに余白があるので、チャットは端まで広げる。
 */
export default function OrganizerMessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-2 -mb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:-mx-6 sm:-mt-3 min-[900px]:-mx-6 min-[900px]:-my-2.5">
      <MessagesLayout>{children}</MessagesLayout>
    </div>
  );
}
