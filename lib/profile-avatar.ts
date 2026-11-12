export type ProfileAvatarRole = "participant" | "organizer";

export type ProfileAvatarFields = {
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  participant_avatar_url?: string | null;
  organizer_avatar_url?: string | null;
  active_profile_role?: ProfileAvatarRole | null;
};

export function normalizeProfileAvatarRole(
  role: string | null | undefined
): ProfileAvatarRole {
  return role === "organizer" ? "organizer" : "participant";
}

/**
 * 役割に合うアイコンを返す。役割を指定しないときは参加者のアイコン。
 * 前は「表示モード」（active_profile_role）でふだんの顔を選んでいたが、主催者モードと利用者モードを画面で分けたので、
 * 利用者側（投稿・アルバム・フォローなど）は参加者のアイコン、主催者として話すとき・主催者の画面では主催者のアイコンを、
 * 呼び出し側が役割を渡して決める。
 */
export function resolveAvatarUrlByRole(
  profile: ProfileAvatarFields,
  role?: ProfileAvatarRole | null
): string | null {
  const resolvedRole = normalizeProfileAvatarRole(role ?? "participant");
  if (resolvedRole === "organizer") {
    // 主催者アイコン未設定時は参加者/旧カラムへフォールバック（ヘッダーとマイページで食い違わないように）
    return (
      profile.organizer_avatar_url ??
      profile.participant_avatar_url ??
      profile.avatar_url ??
      null
    );
  }
  return profile.participant_avatar_url ?? profile.avatar_url ?? null;
}

export function resolveProfileDisplayName(
  profile: Pick<ProfileAvatarFields, "display_name" | "email">,
  fallback = "ゲスト"
): string {
  const name = profile.display_name?.trim();
  if (name) return name;
  const emailName = profile.email?.split("@")[0]?.trim();
  if (emailName) return emailName;
  return fallback;
}

export function buildProfileInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "？";
  const compact = trimmed.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase();
}
