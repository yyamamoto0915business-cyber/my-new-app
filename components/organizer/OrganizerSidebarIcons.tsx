/** 主催者サイドバー用アイコン（モック準拠） */

const GREEN = "#2D7A4F";
const GREEN_MUTED = "#5A8F6E";

export function OrganizerSidebarBrandLogo() {
  return (
    <img
      src="/organizer/sidebar-brand-logo-v2.png"
      alt=""
      width={44}
      height={44}
      decoding="async"
      className="block h-11 w-11 shrink-0 object-contain"
      aria-hidden
    />
  );
}

type NavIconProps = { active?: boolean };

export function OrganizerSidebarDashboardIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="2" y="2" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.4" />
      <rect x="12" y="2" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.4" />
      <rect x="2" y="12" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.4" />
      <rect x="12" y="12" width="8" height="8" rx="2" stroke={stroke} strokeWidth="1.4" />
      <path d="M5 6h2M5 9h2M15 5.5a2 2 0 110 4M5 15h2v2H5v-2zM15 15l2 2" stroke={stroke} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OrganizerSidebarListingsIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="3" y="3.5" width="16" height="5" rx="1.5" stroke={stroke} strokeWidth="1.4" />
      <rect x="3" y="10.5" width="16" height="5" rx="1.5" stroke={stroke} strokeWidth="1.4" />
      <path d="M6 6h4M6 13h6" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="15.5" cy="6" r="1" fill={stroke} />
      <circle cx="15.5" cy="13" r="1" fill={stroke} />
    </svg>
  );
}

export function OrganizerSidebarPayoutsIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="2.5" y="5" width="17" height="12" rx="2.2" stroke={stroke} strokeWidth="1.4" />
      <path d="M2.5 9h17" stroke={stroke} strokeWidth="1.4" />
      <rect x="5" y="12.5" width="5" height="1.8" rx="0.6" fill={stroke} />
    </svg>
  );
}

export function OrganizerSidebarPlanIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M11 3.2l1.7 3.8 4.1.4-3.1 2.8.9 4-3.6-2.1-3.6 2.1.9-4-3.1-2.8 4.1-.4L11 3.2z"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OrganizerSidebarAdminIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5L3.5 5.2v4.8c0 3.6 2.8 6.9 6.5 7.5 3.7-.6 6.5-3.9 6.5-7.5V5.2L10 2.5z"
        stroke="white"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="9" r="1.4" fill="white" />
      <path d="M7.2 12.2c.8-1 1.6-1.5 2.8-1.5s2 .5 2.8 1.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OrganizerSidebarBackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="7.5" stroke={GREEN} strokeWidth="1.2" />
      <path d="M10 6.5L7.5 9 10 11.5" stroke={GREEN} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 9h4.5" stroke={GREEN} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
