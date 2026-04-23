import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";

/** マイページ：クライアント取得の前に即時表示するスケルトン（体感待ち時間を短くする） */
export default function ProfileLoading() {
  return <ProfilePageSkeleton />;
}
