type IconProps = {
  className?: string;
};

/** 地域イベント：マップピン（家なし・太陽のみ） */
export function AuthFeatureEventIcon({ className = "h-[52px] w-[52px]" }: IconProps) {
  return (
    <svg
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="26" cy="26" r="25" fill="#EDF6EF" stroke="#D4E8D8" strokeWidth="1" />
      <path
        d="M26 11c-5.2 0-9.5 4.1-9.5 9.2 0 6.8 9.5 15.8 9.5 15.8s9.5-8.9 9.5-15.8C35.5 15.1 31.2 11 26 11z"
        fill="#fff"
        stroke="#1E3828"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="19.5" r="4.2" fill="#C9A227" />
    </svg>
  );
}
