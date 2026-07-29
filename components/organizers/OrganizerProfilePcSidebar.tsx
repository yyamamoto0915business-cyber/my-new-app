import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  activityArea: string | null;
  categories: CategoryKey[];
  activityStartedAt?: string | null;
  instagramUrl: string | null;
  xUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
};

export function OrganizerProfilePcSidebar({
  className,
  activityArea,
  categories,
  activityStartedAt,
  instagramUrl,
  xUrl,
  facebookUrl,
  websiteUrl,
  publicEmail,
  publicPhone,
}: Props) {
  const hasSocial = instagramUrl || xUrl || facebookUrl || websiteUrl;
  const hasContact = publicEmail || publicPhone;
  const hasProfileDetails =
    activityArea || categories.length > 0 || activityStartedAt;

  if (!hasProfileDetails && !hasSocial && !hasContact) {
    return null;
  }

  return (
    <aside className={cn("hidden flex-col gap-3 lg:flex", className)}>
      {(hasProfileDetails || hasSocial) && (
      <div className="rounded-[16px] p-4" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div className="mb-2.5 text-[12.5px] font-bold tracking-wide" style={{ color: "#4a5a48" }}>
          プロフィール
        </div>

        {hasProfileDetails ? (
          <div className="flex flex-col gap-2">
            {activityArea ? (
              <InfoRow icon={<LocationIcon />} label="活動地域" value={activityArea} />
            ) : null}
            {categories.length > 0 ? (
              <InfoRow
                icon={<GridIcon />}
                label="ジャンル"
                value={categories.slice(0, 4).map((k) => CATEGORY_LABELS[k]).join("・")}
              />
            ) : null}
            {activityStartedAt ? (
              <InfoRow icon={<CalendarIcon />} label="活動開始" value={activityStartedAt} />
            ) : null}
          </div>
        ) : null}

        {hasSocial ? (
          <div className={hasProfileDetails ? "mt-3 border-t pt-3" : ""} style={{ borderColor: "#e8ede4" }}>
            <div className="mb-2 text-[12px] font-medium" style={{ color: "#4a5a48" }}>
              公式リンク
            </div>
            <div className="flex flex-wrap gap-2">
              {instagramUrl ? <SocialButton href={instagramUrl} type="instagram" label="Instagram" /> : null}
              {xUrl ? <SocialButton href={xUrl} type="x" label="X" /> : null}
              {facebookUrl ? <SocialButton href={facebookUrl} type="facebook" label="Facebook" /> : null}
              {websiteUrl ? <SocialButton href={websiteUrl} type="link" label="Web" /> : null}
            </div>
          </div>
        ) : null}
      </div>
      )}

      {hasContact ? (
        <div className="rounded-[16px] p-4" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div className="mb-2 text-[13px] font-bold" style={{ color: "#1a2818" }}>
            公開連絡先
          </div>
          <div className="flex flex-col gap-2 text-[13px]" style={{ color: "#3a4a38" }}>
            {publicEmail ? (
              <a href={`mailto:${publicEmail}`} className="hover:underline" style={{ color: "#3a8040" }}>
                {publicEmail}
              </a>
            ) : null}
            {publicPhone ? (
              <a href={`tel:${publicPhone}`} className="hover:underline" style={{ color: "#3a8040" }}>
                {publicPhone}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="mb-0.5 text-[12px]" style={{ color: "#607060" }}>
          {label}
        </div>
        <div className="text-[13.5px] font-medium leading-snug" style={{ color: "#1a2818" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SocialButton({
  href,
  type,
  label,
}: {
  href: string;
  type: "instagram" | "x" | "facebook" | "link";
  label: string;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80";
  if (type === "instagram") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={base}
        aria-label={label}
        title={label}
        style={{
          background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="#fff" />
        </svg>
      </a>
    );
  }
  if (type === "x") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={base}
        aria-label={label}
        title={label}
        style={{ background: "#000", color: "#fff", fontSize: 13, fontWeight: 800 }}
      >
        X
      </a>
    );
  }
  if (type === "facebook") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={base}
        aria-label={label}
        title={label}
        style={{ background: "#1877f2" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={base}
      aria-label={label}
      title={label}
      style={{ background: "#f0f4ec", border: "1px solid #e4ede4" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#607060" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    </a>
  );
}

function LocationIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="3" />
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#3a8040" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
