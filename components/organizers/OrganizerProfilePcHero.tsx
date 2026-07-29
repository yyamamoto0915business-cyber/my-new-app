import Link from "next/link";
import { OrganizerFollowButton } from "@/app/organizers/[id]/OrganizerFollowButton";
import { OrganizerRemoteImage } from "@/components/organizers/OrganizerRemoteImage";

type Props = {
  organizationName: string;
  avatarUrl: string | null;
  initial: string;
  bio: string | null;
  totalEventCount: number;
  totalParticipants: number;
};

export function OrganizerProfilePcHero({
  organizationName,
  avatarUrl,
  initial,
  bio,
  totalEventCount,
  totalParticipants,
}: Props) {
  const metaParts: string[] = [];
  if (totalEventCount > 0) metaParts.push(`開催 ${totalEventCount}回`);
  if (totalParticipants > 0) metaParts.push(`のべ参加者 ${totalParticipants.toLocaleString()}人`);

  const avatarFallback = <span>{initial}</span>;

  return (
    <section
      className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
      aria-label="主催者プロフィール"
    >
      <div className="relative px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold"
            style={{ background: "#c8ddb8", fontSize: 22, color: "#3a6030" }}
          >
            {avatarUrl?.trim() ? (
              <OrganizerRemoteImage
                src={avatarUrl}
                fill
                className="object-cover"
                sizes="56px"
                fallback={avatarFallback}
              />
            ) : (
              avatarFallback
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[20px] font-bold leading-tight tracking-[-0.02em]" style={{ color: "#1a2818" }}>
                {organizationName}
              </h1>
              {(bio || metaParts.length > 0) && (
                <div className="mt-1 space-y-0.5">
                  {bio ? (
                    <p className="line-clamp-1 text-[13.5px] leading-snug" style={{ color: "#2a3a28" }}>
                      {bio}
                    </p>
                  ) : null}
                  {metaParts.length > 0 ? (
                    <p className="text-[12.5px] font-medium" style={{ color: "#4a5a48" }}>
                      {metaParts.join(" · ")}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <OrganizerFollowButton pcStyle className="!h-9 !min-w-0 !flex-none !text-[12.5px] !px-4" />
              <Link
                href="/messages"
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-semibold transition-all hover:bg-[#f5faf5]"
                style={{
                  background: "#fff",
                  color: "#3a8040",
                  border: "1.5px solid #3a8040",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                相談する
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
