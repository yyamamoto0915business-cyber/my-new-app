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

export function resolveAvatarUrlByRole(
  profile: ProfileAvatarFields,
  role?: ProfileAvatarRole | null
): string | null {
  const resolvedRole = normalizeProfileAvatarRole(role ?? profile.active_profile_role);
  if (resolvedRole === "organizer") {
    return profile.organizer_avatar_url ?? profile.avatar_url ?? null;
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
