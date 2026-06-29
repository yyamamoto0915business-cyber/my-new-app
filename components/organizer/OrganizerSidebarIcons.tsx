/** 主催者サイドバー用アイコン（モック準拠） */

const GREEN = "#2D7A4F";
const GREEN_MUTED = "#5A8F6E";

export function OrganizerSidebarBrandLogo() {
  return (
    <img
      src="/organizer/sidebar-brand-logo.png"
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

export function OrganizerSidebarInboxIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path
        d="M3 7.5A2.5 2.5 0 015.5 5h11A2.5 2.5 0 0119 7.5v7A2.5 2.5 0 0116.5 17h-11A2.5 2.5 0 013 14.5v-7z"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M3 8.5l6.2 4.3a2 2 0 002.2 0L17.5 8.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M11 3.5c0-1 .6-1.8 1.2-2.2.4-.3.8-.3 1.2 0 .6.4 1.2 1.2 1.2 2.2"
        stroke={GREEN}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M11 3.5v1.2" stroke={GREEN} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OrganizerSidebarSettingsIcon({ active }: NavIconProps) {
  const stroke = active ? GREEN : GREEN_MUTED;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="2.6" stroke={stroke} strokeWidth="1.4" />
      <path
        d="M11 2.5v2.2M11 17.3v2.2M2.5 11h2.2M17.3 11h2.2M4.8 4.8l1.6 1.6M15.6 15.6l1.6 1.6M4.8 17.2l1.6-1.6M15.6 6.4l1.6-1.6"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M11 9.2c-.5.8-.2 1.8.6 2.1.5.2 1 .1 1.4-.2"
        stroke={GREEN}
        strokeWidth="1"
        strokeLinecap="round"
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
