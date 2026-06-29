import Link from "next/link";
import Image from "next/image";
import { OrganizerFollowButton } from "@/app/organizers/[id]/OrganizerFollowButton";

type Props = {
  organizationName: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  initial: string;
  bio: string | null;
  activityArea: string | null;
  totalEventCount: number;
  totalParticipants: number;
};

type StatItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

export function OrganizerProfilePcHero({
  organizationName,
  avatarUrl,
  coverImageUrl,
  initial,
  bio,
  activityArea,
  totalEventCount,
  totalParticipants,
}: Props) {
  const stats: StatItem[] = [];

  if (activityArea) {
    stats.push({
      label: "活動地域",
      value: activityArea,
      icon: <LocationIcon />,
    });
  }
  if (totalEventCount > 0) {
    stats.push({
      label: "開催数",
      value: `${totalEventCount}回`,
      icon: <CalendarIcon />,
    });
  }
  if (totalParticipants > 0) {
    stats.push({
      label: "累計参加者",
      value: `のべ ${totalParticipants.toLocaleString()}人`,
      icon: <UsersIcon />,
    });
  }

  return (
    <section
      className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
      aria-label="主催者プロフィール"
    >
      <div className="relative h-[140px] w-full overflow-hidden" style={{ background: "#c8ddb8" }}>
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="1100px"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#c8ddb8] to-[#9abf9a]" />
        )}
      </div>

      <div className="relative px-5 pb-4">
        <div className="-mt-8 flex items-start gap-3">
          <div
            className="relative z-[1] flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white font-bold shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            style={{ background: "#c8ddb8", fontSize: 24, color: "#3a6030" }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-[20px] font-bold leading-tight tracking-[-0.02em]" style={{ color: "#1a2818" }}>
              {organizationName}
            </h1>

            {bio ? (
              <p className="mt-1 line-clamp-2 text-[13px] leading-[1.6]" style={{ color: "#3a4a38" }}>
                {bio}
              </p>
            ) : null}
          </div>
        </div>

        {stats.length > 0 ? (
          <div
            className="mt-3 grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}
          >
            {stats.map((stat) => (
              <StatBox key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} />
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-2.5">
          <OrganizerFollowButton pcStyle className="min-w-0 flex-1 !h-10 !text-[13px]" />
          <Link
            href="/messages"
            className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: "#fff",
              color: "#3a8040",
              border: "1.5px solid #3a8040",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            主催者に相談する
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2"
      style={{ background: "#fafcf8", border: "1px solid #e4ede4" }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: "#eef5ef" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px]" style={{ color: "#98a898" }}>
          {label}
        </div>
        <div className="truncate text-[12.5px] font-semibold" style={{ color: "#1a2818" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LocationIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="3" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
