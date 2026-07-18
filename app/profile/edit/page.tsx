"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";

type ProfileTab = "participant" | "organizer";
type PStep = 1 | 2 | 3 | 4;
type OStep = 1 | 2 | 3 | 4;

const INP =
  "w-full px-[13px] py-[10px] rounded-[10px] border border-[#DEDAD2] bg-[#F5F4EF] text-[13px] text-[#18181a] outline-none placeholder:text-[#c0bdb8] disabled:text-[#8c8a84] disabled:cursor-not-allowed focus:border-[#2B3A6B] focus:bg-white transition-[border-color,background]";

const INP_PC =
  "w-full rounded-[8px] border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] text-[#18181a] outline-none placeholder:text-[#A0AEC0] disabled:cursor-not-allowed disabled:bg-[#F7FAFC] disabled:text-[#8c8a84] focus:border-[#2B3A6B] focus:shadow-[0_0_0_2px_rgba(43,58,107,.08)] transition-[border-color,box-shadow]";

/** PC プロフィール編集 — モック準拠の色 */
const PC = {
  page: "#F0F4F8",
  card: "#FFFFFF",
  border: "#E2E8F0",
  ink: "#1A202C",
  muted: "#718096",
  navy: "#2B3A6B",
  green: "#48BB78",
  greenHover: "#38A169",
  pro: "#ED8936",
  proSoft: "#FFFAF0",
  inset: "#F7FAFC",
  infoBlue: "#EBF8FF",
  infoBlueBorder: "#BEE3F8",
  infoBlueInk: "#2C5282",
  infoTeal: "#E6FFFA",
  infoTealBorder: "#B2F5EA",
  infoTealInk: "#285E61",
  infoGreen: "#F0FFF4",
  infoGreenBorder: "#9AE6B4",
  infoGreenInk: "#276749",
} as const;

function ChevR() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ChevL() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function CheckIco({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function UploadIco() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function CamIco() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function ImgIco({ stroke = "currentColor" }: { stroke?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function Opt({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] min-[900px]:text-[10px] text-[#8c8a84] px-[6px] min-[900px]:px-[7px] py-[1px] bg-[#F5F4EF] rounded-[20px] border-[0.5px] border-[#DEDAD2]">
      {children}
    </span>
  );
}
function Fl({ opt, children }: { opt?: boolean; children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-[500] mb-[5px] flex items-center gap-[5px]">
      {children}
      {opt && <Opt>任意</Opt>}
    </div>
  );
}
function Fh({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] text-[#8c8a84] mt-[3px] leading-[1.5]">{children}</div>;
}
function MCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#DEDAD2] p-[14px] mb-[10px] shadow-[0_1px_3px_rgba(0,0,0,.05),0_2px_8px_rgba(0,0,0,.06)]">
      {children}
    </div>
  );
}
function MCardTitle({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-[600] mb-[3px] flex items-center gap-[6px]" style={color ? { color } : undefined}>
      {children}
    </div>
  );
}
function MCardSub({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-[#8c8a84] mb-[12px] leading-[1.5]">{children}</div>;
}
function MField({ children }: { children: React.ReactNode }) {
  return <div className="mb-[12px] last:mb-0">{children}</div>;
}

function AvatarImg({ url, size, rounded = "full", initials = "?" }: {
  url: string; size: number; rounded?: "full" | "10"; initials?: string;
}) {
  const [err, setErr] = useState(false);
  const br = rounded === "full" ? "50%" : "10px";
  const bg = rounded === "10" ? "#2B3A6B" : "#5a8a70";
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" width={size} height={size} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: br, objectFit: "cover", display: "block" }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: br, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: Math.floor(size * 0.3), fontWeight: 700 }}>
      {initials.slice(0, 2)}
    </div>
  );
}

function IconBlock({ label, url, onFile, onCamera, urlValue, onUrlChange, rounded = "full", initials = "?" }: {
  label: string; url: string; onFile: () => void; onCamera: () => void;
  urlValue: string; onUrlChange: (v: string) => void; rounded?: "full" | "10"; initials?: string;
}) {
  return (
    <div className="bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2] p-[11px] mb-[10px] last:mb-0">
      <div className="text-[11px] font-[600] text-[#52504c] mb-[9px]">{label}</div>
      <div className="flex items-center gap-[11px] mb-[8px]">
        <div className="flex-shrink-0 overflow-hidden border-[2px] border-[#DEDAD2]"
          style={{ width: 46, height: 46, borderRadius: rounded === "full" ? "50%" : "10px" }}>
          <AvatarImg url={url} size={46} rounded={rounded} initials={initials} />
        </div>
        <div className="flex flex-col gap-[6px] flex-1">
          <button type="button" onClick={onFile}
            className="py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex items-center justify-center gap-[5px]">
            <UploadIco /> アルバムから選択
          </button>
          <button type="button" onClick={onCamera}
            className="py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex items-center justify-center gap-[5px]">
            <CamIco /> カメラで撮影
          </button>
        </div>
      </div>
      <input type="text" value={urlValue} onChange={e => onUrlChange(e.target.value)} placeholder="または URL を入力" className={INP} />
    </div>
  );
}

function CoverPreview({ url, height }: { url: string; height: number }) {
  const [err, setErr] = useState(false);
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" onError={() => setErr(true)}
        style={{ width: "100%", height, borderRadius: 8, objectFit: "cover", display: "block", border: "1px solid #DEDAD2" }} />
    );
  }
  return (
    <div style={{ width: "100%", height, borderRadius: 8, background: "#3a6a50", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #DEDAD2" }}>
      <ImgIco stroke="rgba(255,255,255,.5)" />
    </div>
  );
}

function StepInd({ steps, current, mode, onGo }: {
  steps: string[]; current: number; mode: "p" | "o"; onGo: (s: number) => void;
}) {
  const activeCircle = mode === "p" ? "bg-[#2B3A6B] text-white" : "bg-[#c8a84b] text-white";
  const activeLabel = mode === "p" ? "text-[#2B3A6B] font-[500]" : "text-[#86620a] font-[500]";
  return (
    <div className="flex shrink-0 items-center overflow-x-auto border-b border-[#DEDAD2] bg-white px-2 pb-[9px] pt-[7px] min-[380px]:px-3">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center flex-1 min-w-[68px]">
            <div className="flex flex-col items-center gap-[3px] cursor-pointer w-full" onClick={() => onGo(step)}>
              <div className={["w-[22px] h-[22px] min-[380px]:w-[24px] min-[380px]:h-[24px] rounded-full flex items-center justify-center text-[10px] font-[700] transition-all",
                done ? "bg-[#4fa82a] text-white" : active ? activeCircle : "bg-[#F5F4EF] text-[#8c8a84] border-[1.5px] border-[#DEDAD2]"].join(" ")}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : step === steps.length ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={active ? "#fff" : "#8c8a84"} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /></svg>
                ) : step}
              </div>
              <div className={["text-[7px] min-[380px]:text-[8px] text-center leading-tight max-w-full px-0.5", done ? "text-[#4fa82a]" : active ? activeLabel : "text-[#8c8a84]"].join(" ")}>
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={["flex-1 h-[1.5px] mx-[2px] min-[380px]:mx-[3px] mb-[13px] min-w-[8px]", done ? "bg-[#4fa82a]" : "bg-[#DEDAD2]"].join(" ")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PanelHd({ icBg, icon, opt, children }: { icBg: string; icon: React.ReactNode; opt?: string; children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-[700] text-[#8c8a84] tracking-[.1em] uppercase flex items-center gap-[6px] flex-shrink-0">
      <div className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: icBg }}>{icon}</div>
      {children}
      {opt && <Opt>{opt}</Opt>}
    </div>
  );
}

function PcSectionTitle({ icBg, icon, opt, children }: { icBg: string; icon: React.ReactNode; opt?: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: icBg }}>
        {icon}
      </div>
      <span className="text-[13px] font-semibold" style={{ color: PC.ink }}>{children}</span>
      {opt && <Opt>{opt}</Opt>}
    </div>
  );
}

const PC_CARD =
  "rounded-[12px] border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,.04),0_2px_8px_rgba(15,23,42,.04)]";

function PcCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${PC_CARD} ${className ?? ""}`} style={{ borderColor: PC.border, backgroundColor: PC.card }}>
      {children}
    </div>
  );
}

function PcCol({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto overscroll-contain ${className ?? ""}`}>
      {children}
    </div>
  );
}

function PcField({
  label,
  hint,
  opt,
  children,
}: {
  label: string;
  hint?: string;
  opt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[12px] font-medium" style={{ color: PC.ink }}>
        {label}
        {opt && <Opt>任意</Opt>}
      </div>
      {children}
      {hint ? <p className="text-[10px] leading-snug" style={{ color: PC.muted }}>{hint}</p> : null}
    </div>
  );
}

function PcIconBlock({
  label,
  url,
  onFile,
  onCamera,
  urlValue,
  onUrlChange,
  rounded = "full",
  initials = "?",
}: {
  label: string;
  url: string;
  onFile: () => void;
  onCamera: () => void;
  urlValue: string;
  onUrlChange: (v: string) => void;
  rounded?: "full" | "10";
  initials?: string;
}) {
  return (
    <div className="rounded-[8px] border p-2" style={{ borderColor: PC.border, backgroundColor: PC.inset }}>
      <div className="mb-1 text-[11px] font-semibold" style={{ color: PC.ink }}>{label}</div>
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className="shrink-0 overflow-hidden border border-[#DEDAD2]"
          style={{ width: 36, height: 36, borderRadius: rounded === "full" ? "50%" : "8px" }}
        >
          <AvatarImg url={url} size={36} rounded={rounded} initials={initials} />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={onFile}
            className="flex items-center gap-0.5 rounded-[6px] border bg-white px-2 py-1 text-[10px] transition-colors hover:bg-[#EDF2F7]"
            style={{ borderColor: PC.border, color: PC.ink }}
          >
            <UploadIco /> アルバム
          </button>
          <button
            type="button"
            onClick={onCamera}
            className="flex items-center gap-0.5 rounded-[6px] border bg-white px-2 py-1 text-[10px] transition-colors hover:bg-[#EDF2F7]"
            style={{ borderColor: PC.border, color: PC.ink }}
          >
            <CamIco /> カメラ
          </button>
        </div>
      </div>
      <input
        type="text"
        value={urlValue}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="または URL を入力"
        className={INP_PC}
      />
    </div>
  );
}

function PcProgressList({
  items,
}: {
  items: { label: string; done: boolean; st: string }[];
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[8px] border" style={{ borderColor: PC.border, backgroundColor: PC.inset }}>
      {items.map(({ label, done, st }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 border-b px-2 py-1.5 last:border-0"
          style={{ borderColor: PC.border }}
        >
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: done ? PC.green : "#CBD5E0" }}
          />
          <div className="min-w-0 flex-1 truncate text-[11px]" style={{ color: PC.ink }}>{label}</div>
          <div
            className="shrink-0 text-[10px] font-medium"
            style={{ color: done ? PC.green : PC.muted }}
          >
            {st}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoBalloonDecor() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" aria-hidden className="text-[#90CDF4]">
      <ellipse cx="52" cy="18" rx="14" ry="16" fill="currentColor" opacity="0.35" />
      <path d="M52 34v6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <rect x="48" y="40" width="8" height="5" rx="1" fill="currentColor" opacity="0.3" />
      <ellipse cx="30" cy="28" rx="11" ry="13" fill="currentColor" opacity="0.25" />
      <path d="M30 41v5" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <ellipse cx="58" cy="42" rx="8" ry="6" fill="currentColor" opacity="0.2" />
      <ellipse cx="18" cy="38" rx="7" ry="5" fill="currentColor" opacity="0.18" />
      <circle cx="45" cy="12" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="62" cy="8" r="2.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function InfoPrivacyDecor() {
  return (
    <svg width="64" height="56" viewBox="0 0 64 56" fill="none" aria-hidden>
      <path
        d="M38 8c-6 0-11 4-11 10v4h-3v6h28v-6h-3v-4c0-6-5-10-11-10z"
        fill="#9AE6B4"
        opacity="0.45"
      />
      <rect x="30" y="26" width="16" height="12" rx="2" fill="#ECC94B" opacity="0.55" />
      <circle cx="38" cy="32" r="2.5" fill="#D69E2E" opacity="0.7" />
      <path
        d="M48 38c4 6 8 10 12 14"
        stroke="#68D391"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <ellipse cx="54" cy="48" rx="6" ry="4" fill="#9AE6B4" opacity="0.35" />
      <ellipse cx="50" cy="44" rx="4" ry="3" fill="#68D391" opacity="0.3" />
    </svg>
  );
}

function PcInfoCallout({
  variant,
  title,
  children,
}: {
  variant: "blue" | "green";
  title: string;
  children: React.ReactNode;
}) {
  const isBlue = variant === "blue";
  const border = isBlue ? PC.infoBlueBorder : PC.infoGreenBorder;
  const bg = isBlue ? PC.infoBlue : PC.infoGreen;
  const titleColor = isBlue ? PC.infoBlueInk : PC.infoGreenInk;
  const bodyColor = isBlue ? "#4A5568" : "#4A5568";

  const icon = isBlue ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3182CE" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38A169" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );

  return (
    <div
      className="relative overflow-hidden rounded-[12px] border"
      style={{ borderColor: border, backgroundColor: bg }}
    >
      <div className="relative z-[1] px-3.5 py-3 pr-[4.5rem]">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold leading-tight" style={{ color: titleColor }}>
              {title}
            </div>
            <p className="mt-1.5 text-[11px] leading-[1.65]" style={{ color: bodyColor }}>
              {children}
            </p>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute right-1 top-1/2 z-0 -translate-y-1/2 opacity-70"
        aria-hidden
      >
        {isBlue ? <InfoBalloonDecor /> : <InfoPrivacyDecor />}
      </div>
    </div>
  );
}

function SnsRow({ bg, icon, value, onChange, placeholder }: {
  bg: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="flex items-center gap-[8px] flex-shrink-0">
      <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>{icon}</div>
      <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={INP_PC} />
    </div>
  );
}

function ProfileEditPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSupabaseUser();
  const fromSignup = searchParams.get("from") === "signup";
  const tabParam = searchParams.get("tab");
  const asParam = searchParams.get("as");
  const registerAs =
    asParam === "individual" || asParam === "organization" ? asParam : null;
  const orgNameLabel =
    registerAs === "individual"
      ? "お名前・活動名"
      : registerAs === "organization"
        ? "団体名"
        : "団体名・主催者名";
  const orgNamePlaceholder =
    registerAs === "individual"
      ? "例：山田太郎 / まち歩きクラブ"
      : registerAs === "organization"
        ? "例：地域振興会 / ○○実行委員会"
        : "例：地域振興会 / 山田太郎";

  const [tab, setTab] = useState<ProfileTab>(
    tabParam === "organizer" ? "organizer" : "participant"
  );
  const [pStep, setPStep] = useState<PStep>(1);
  const [oStep, setOStep] = useState<OStep>(1);
  const [loading, setLoading] = useState(true);
  const [pSaving, setPSaving] = useState(false);
  const [oSaving, setOSaving] = useState(false);
  const [pError, setPError] = useState<string | null>(null);
  const [pSuccess, setPSuccess] = useState(false);
  const [oError, setOError] = useState<string | null>(null);
  const [oSuccess, setOSuccess] = useState(false);
  const [noSupabase, setNoSupabase] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [organizerId, setOrganizerId] = useState<string | null>(null);

  // Participant fields
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [region, setRegion] = useState("");
  const [bio, setBio] = useState("");
  const [pAvatarUrl, setPAvatarUrl] = useState("");
  const [oModeAvatarUrl, setOModeAvatarUrl] = useState("");
  const [activeRole, setActiveRole] = useState<"participant" | "organizer">("participant");

  // Organizer fields
  const [organizationName, setOrganizationName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [orgBio, setOrgBio] = useState("");
  const [activityArea, setActivityArea] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [orgAvatarUrl, setOrgAvatarUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [publicPhone, setPublicPhone] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const pFileRef = useRef<HTMLInputElement>(null);
  const pCamRef = useRef<HTMLInputElement>(null);
  const oModeFileRef = useRef<HTMLInputElement>(null);
  const oModeCamRef = useRef<HTMLInputElement>(null);
  const orgAvatarRef = useRef<HTMLInputElement>(null);
  const orgCoverRef = useRef<HTMLInputElement>(null);
  const orgGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tabParam === "organizer" || tabParam === "participant") {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setNoSupabase(true); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser || cancelled) { setLoading(false); return; }
        setEmail(authUser.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, participant_avatar_url, avatar_url, organizer_avatar_url, active_profile_role, phone, address, region, bio")
          .eq("id", authUser.id)
          .single();
        if (!cancelled && profile) {
          setDisplayName((profile.display_name as string) ?? "");
          setPAvatarUrl((profile.participant_avatar_url as string) ?? (profile.avatar_url as string) ?? "");
          setOModeAvatarUrl((profile.organizer_avatar_url as string) ?? "");
          setActiveRole(profile.active_profile_role === "organizer" ? "organizer" : "participant");
          setPhone((profile.phone as string) ?? "");
          setAddress((profile.address as string) ?? "");
          setRegion((profile.region as string) ?? "");
          setBio((profile.bio as string) ?? "");
        }
        const { data: org } = await supabase
          .from("organizers")
          .select("id, organization_name")
          .eq("profile_id", authUser.id)
          .maybeSingle();
        if (!cancelled && org) {
          setIsOrganizer(true);
          setOrganizerId(org.id as string);
          setOrganizationName((org.organization_name as string) ?? "");
          const { data: op } = await supabase
            .from("organizer_profiles")
            .select("avatar_url, short_bio, bio, activity_area, cover_image_url, gallery_images, website_url, instagram_url, x_url, facebook_url, public_email, public_phone, show_email, show_phone")
            .eq("organizer_id", org.id)
            .maybeSingle();
          if (!cancelled && op) {
            setOrgAvatarUrl((op.avatar_url as string) ?? "");
            setShortBio((op.short_bio as string) ?? "");
            setOrgBio((op.bio as string) ?? "");
            setActivityArea((op.activity_area as string) ?? "");
            setCoverImageUrl((op.cover_image_url as string) ?? "");
            setGalleryImages(Array.isArray(op.gallery_images) ? (op.gallery_images as string[]) : []);
            setWebsiteUrl((op.website_url as string) ?? "");
            setInstagramUrl((op.instagram_url as string) ?? "");
            setXUrl((op.x_url as string) ?? "");
            setFacebookUrl((op.facebook_url as string) ?? "");
            setPublicEmail((op.public_email as string) ?? "");
            setPublicPhone((op.public_phone as string) ?? "");
            setShowEmail(Boolean(op.show_email));
            setShowPhone(Boolean(op.show_phone));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const uploadToStorage = useCallback(async (bucket: string, path: string, file: File): Promise<string> => {
    const supabase = createClient();
    if (!supabase) throw new Error("ストレージが利用できません");
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }, []);

  const handlePAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user?.id) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadToStorage("avatars", `${user.id}/participant/avatar.${ext}`, file);
      setPAvatarUrl(url);
    } catch (err) { setPError(err instanceof Error ? err.message : "アップロードに失敗しました"); }
  };
  const handleOModeAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user?.id) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadToStorage("avatars", `${user.id}/organizer/avatar.${ext}`, file);
      setOModeAvatarUrl(url);
    } catch (err) { setPError(err instanceof Error ? err.message : "アップロードに失敗しました"); }
  };
  const handleOrgAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user?.id) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadToStorage("organizer-avatars", `${user.id}/organizer-avatar.${ext}`, file);
      setOrgAvatarUrl(url);
    } catch (err) { setOError(err instanceof Error ? err.message : "アップロードに失敗しました"); }
  };
  const handleOrgCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !user?.id) return;
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const url = await uploadToStorage("organizer-covers", `${user.id}/organizer-cover.${ext}`, file);
      setCoverImageUrl(url);
    } catch (err) { setOError(err instanceof Error ? err.message : "アップロードに失敗しました"); }
  };
  const handleOrgGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length || !user?.id) return;
    const toUpload = files.slice(0, 6 - galleryImages.length);
    if (!toUpload.length) { setOError("ギャラリー画像は最大6枚までです"); return; }
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() || "jpg";
        const url = await uploadToStorage("organizer-gallery", `${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`, file);
        urls.push(url);
      }
      setGalleryImages(prev => [...prev, ...urls].slice(0, 6));
    } catch (err) { setOError(err instanceof Error ? err.message : "アップロードに失敗しました"); }
  };

  const saveParticipant = async () => {
    setPError(null); setPSuccess(false); setPSaving(true);
    const supabase = createClient();
    if (!supabase || !user?.id) { setPError("ログインが必要です"); setPSaving(false); return; }
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id, email: email || null, display_name: displayName || null,
        avatar_url: pAvatarUrl || null, participant_avatar_url: pAvatarUrl || null,
        organizer_avatar_url: oModeAvatarUrl || null, active_profile_role: activeRole,
        phone: phone.trim() || null, address: address.trim() || null,
        region: region.trim() || null, bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) throw error;
      await supabase.auth.updateUser({ data: { display_name: displayName || undefined } });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("mg:profile-avatar-updated"));
      }
      setPSuccess(true);
      if (fromSignup) {
        router.push("/");
        router.refresh();
        return;
      }
    } catch (err) { setPError(err instanceof Error ? err.message : "保存に失敗しました"); }
    finally { setPSaving(false); }
  };

  const saveOrganizer = async () => {
    if (!organizerId) { setOError("主催者情報が取得できていません"); return; }
    setOError(null); setOSuccess(false); setOSaving(true);
    const supabase = createClient();
    if (!supabase || !user?.id) { setOError("ログインが必要です"); setOSaving(false); return; }
    try {
      const orgName = organizationName.trim();
      if (!orgName) throw new Error(`${orgNameLabel}は必須です`);
      await supabase.from("organizers").update({ organization_name: orgName, updated_at: new Date().toISOString() }).eq("profile_id", user.id);
      const { error } = await supabase.from("organizer_profiles").upsert({
        organizer_id: organizerId, avatar_url: orgAvatarUrl || null,
        short_bio: shortBio.trim() || null, bio: orgBio.trim() || null,
        activity_area: activityArea.trim() || null,
        cover_image_url: coverImageUrl || null, gallery_images: galleryImages,
        website_url: websiteUrl.trim() || null, instagram_url: instagramUrl.trim() || null,
        x_url: xUrl.trim() || null, facebook_url: facebookUrl.trim() || null,
        public_email: publicEmail.trim() || null, public_phone: publicPhone.trim() || null,
        show_email: showEmail, show_phone: showPhone, updated_at: new Date().toISOString(),
      }, { onConflict: "organizer_id" });
      if (error) throw error;
      setOSuccess(true);
      if (fromSignup) {
        router.push("/");
        router.refresh();
        return;
      }
    } catch (err) { setOError(err instanceof Error ? err.message : "保存に失敗しました"); }
    finally { setOSaving(false); }
  };

  const goBackOrSkip = () => {
    if (fromSignup) {
      router.push("/");
      return;
    }
    router.push("/profile");
  };

  const initials = displayName.trim().slice(0, 2) || "?";
  const pStepLabels = ["基本情報", "アイコン", "表示モード", "確認・保存"];
  const oStepLabels = ["紹介文", "画像", "SNS/連絡先", "確認・保存"];
  const pStepTitles = fromSignup
    ? ["基本情報を登録", "アイコンを設定", "表示モードを設定", "確認・保存"]
    : ["基本情報を編集", "アイコンを設定", "表示モードを設定", "確認・保存"];
  const oStepTitles = fromSignup
    ? ["紹介文を登録", "画像を設定", "SNS / 連絡先", "確認・保存"]
    : ["紹介文を編集", "画像を設定", "SNS / 連絡先", "確認・保存"];

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[13px] text-[#8c8a84]">読み込み中...</p>
    </div>
  );
  if (noSupabase) return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <p className="text-[13px] text-[#8c8a84]">Supabase の設定が必要です</p>
    </div>
  );

  const mobileSaveDisabled = tab === "participant" ? pSaving : oSaving;
  const mobileTitle = tab === "participant" ? pStepTitles[pStep - 1] : oStepTitles[oStep - 1];

  return (
    <div className="mg-profile-mobile-page flex min-h-0 w-full flex-1 flex-col bg-[#EDECE7] max-[899px]:h-dvh max-[899px]:max-h-dvh max-[899px]:overflow-hidden min-[900px]:mx-0 min-[900px]:mt-0 min-[900px]:h-full min-[900px]:max-h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] min-[900px]:w-full min-[900px]:overflow-hidden">
      {/* Hidden file inputs */}
      <input ref={pFileRef} type="file" accept="image/*" className="hidden" onChange={handlePAvatarFile} />
      <input ref={pCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePAvatarFile} />
      <input ref={oModeFileRef} type="file" accept="image/*" className="hidden" onChange={handleOModeAvatarFile} />
      <input ref={oModeCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOModeAvatarFile} />
      <input ref={orgAvatarRef} type="file" accept="image/*" className="hidden" onChange={handleOrgAvatarFile} />
      <input ref={orgCoverRef} type="file" accept="image/*" className="hidden" onChange={handleOrgCoverFile} />
      <input ref={orgGalleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleOrgGalleryFiles} />

      {/* ══ MOBILE — 明示的な h-dvh 連鎖でヘッダー/フッターを常時表示、中央のみスクロール ══ */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden min-[900px]:hidden">
        {/* Header（グローバル MobileTopHeader 非表示のため safe-area をここで確保） */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[#DEDAD2] bg-white px-3 pb-2 pt-[max(8px,env(safe-area-inset-top,0px))]">
          <button type="button"
            onClick={() => {
              if (tab === "participant" && pStep > 1) setPStep(s => (s - 1) as PStep);
              else if (tab === "organizer" && oStep > 1) setOStep(s => (s - 1) as OStep);
              else goBackOrSkip();
            }}
            className="w-[30px] h-[30px] rounded-full bg-[#F5F4EF] border border-[#DEDAD2] flex items-center justify-center flex-shrink-0"
            aria-label={fromSignup ? "あとで整える" : "戻る"}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="text-[14px] font-[600] flex-1 min-w-0 truncate">{mobileTitle}</div>
          {fromSignup ? (
            <button
              type="button"
              onClick={goBackOrSkip}
              className="px-2 py-[7px] text-[11px] font-[500] text-[#8c8a84] flex-shrink-0"
            >
              あとで
            </button>
          ) : null}
          <button type="button"
            onClick={tab === "participant" ? saveParticipant : saveOrganizer}
            disabled={mobileSaveDisabled}
            className={["px-3 min-[380px]:px-4 py-[7px] rounded-[9px] text-[11px] min-[380px]:text-[12px] font-[600] text-white flex-shrink-0 disabled:opacity-50",
              tab === "participant" ? "bg-[#4fa82a]" : "bg-[#c8a84b]"].join(" ")}>
            保存する
          </button>
        </div>

        {/* Profile tabs */}
        <div className="flex shrink-0 border-b border-[#DEDAD2] bg-white">
          {(["participant", "organizer"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={["flex-1 py-2 min-[380px]:py-[9px] text-center text-[11px] min-[380px]:text-[12px] font-[500] border-b-[2px] transition-all",
                tab === t
                  ? t === "participant" ? "text-[#2B3A6B] border-[#2B3A6B]" : "text-[#86620a] border-[#c8a84b]"
                  : "text-[#8c8a84] border-transparent"].join(" ")}>
              {t === "participant" ? (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline mr-1 align-middle"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg><span className="min-[380px]:hidden">参加者</span><span className="hidden min-[380px]:inline">参加者プロフィール</span></>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="inline mr-1 align-middle"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" /></svg><span className="min-[380px]:hidden">主催者</span><span className="hidden min-[380px]:inline">主催者プロフィール</span></>
              )}
            </button>
          ))}
        </div>
        {fromSignup ? (
          <p className="shrink-0 bg-[#F5F4EF] px-3 py-2 text-center text-[11px] leading-snug text-[#52504c]">
            はじめのプロフィール設定です。未入力の項目はあとからでも大丈夫です
          </p>
        ) : null}

        {/* Step indicator */}
        {tab === "participant"
          ? <StepInd steps={pStepLabels} current={pStep} mode="p" onGo={s => setPStep(s as PStep)} />
          : <StepInd steps={oStepLabels} current={oStep} mode="o" onGo={s => setOStep(s as OStep)} />}

        {/* Step content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Participant steps */}
          {tab === "participant" && pStep === 1 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5060b0" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>基本情報</MCardTitle>
                <MCardSub>表示名とメールアドレスを確認・編集できます</MCardSub>
                <MField><Fl>メールアドレス</Fl><input type="email" value={email} disabled className={INP} /><Fh>変更はできません</Fh></MField>
                <MField><Fl>表示名</Fl><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="例: 山田 太郎" className={INP} /><Fh>イベントや申込みで表示される名前です</Fh></MField>
              </MCard>
              <MCard>
                <MCardTitle><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c8a84" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>個人情報</MCardTitle>
                <MCardSub>すべて任意です。あとから入力できます</MCardSub>
                <MField><Fl opt>電話番号</Fl><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="例: 090-1234-5678" className={INP} /></MField>
                <MField><Fl opt>地域</Fl><input type="text" value={region} onChange={e => setRegion(e.target.value)} placeholder="例: 東京都渋谷区" className={INP} /></MField>
                <MField><Fl opt>住所</Fl><input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="例: 〇〇町1-2-3" className={INP} /></MField>
                <MField><Fl opt>自己紹介</Fl><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="あなたについて簡単に紹介してください" className={INP + " resize-none min-h-[80px] leading-[1.7]"} /></MField>
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "participant" && pStep === 2 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a07a28" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>アイコン設定</MCardTitle>
                <MCardSub>参加者用・主催者用で別々に設定できます（任意）</MCardSub>
                <IconBlock label="参加者用アイコン" url={pAvatarUrl} onFile={() => pFileRef.current?.click()} onCamera={() => pCamRef.current?.click()} urlValue={pAvatarUrl} onUrlChange={setPAvatarUrl} initials={initials} />
                <IconBlock label="主催者用アイコン" url={oModeAvatarUrl} onFile={() => oModeFileRef.current?.click()} onCamera={() => oModeCamRef.current?.click()} urlValue={oModeAvatarUrl} onUrlChange={setOModeAvatarUrl} initials={initials} />
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "participant" && pStep === 3 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a8a25" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>現在の表示モード</MCardTitle>
                <MCardSub>参加者と主催者でアイコンが切り替わります</MCardSub>
                <div className="flex gap-[8px] mb-[10px]">
                  {(["participant", "organizer"] as const).map(r => (
                    <button key={r} type="button" onClick={() => setActiveRole(r)}
                      className={["flex-1 py-[9px] rounded-[22px] text-[13px] font-[500] border-[1.5px] transition-all",
                        activeRole === r ? "bg-[#2B3A6B] text-white border-[#2B3A6B]" : "bg-[#F5F4EF] text-[#8c8a84] border-[#DEDAD2]"].join(" ")}>
                      {r === "participant" ? "参加者" : "主催者"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-[10px] px-[12px] py-[10px] bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2]">
                  <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0 border border-[#DEDAD2]">
                    <AvatarImg url={activeRole === "participant" ? pAvatarUrl : oModeAvatarUrl} size={30} initials={initials} />
                  </div>
                  <div className="text-[11px] text-[#8c8a84] leading-[1.5]">
                    {activeRole === "participant" ? <>参加者モードで表示中<br />参加者用アイコンが使われます</> : <>主催者モードで表示中<br />主催者用アイコンが使われます</>}
                  </div>
                </div>
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "participant" && pStep === 4 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[12px] font-[600] text-[#8c8a84]">基本情報</span>
                  <button type="button" onClick={() => setPStep(1)} className="text-[12px] text-[#2B3A6B] font-[500]">編集</button>
                </div>
                <div className="flex justify-between py-[7px] border-b border-[#ECEAE3]"><span className="text-[11px] text-[#8c8a84]">メール</span><span className="text-[12px] font-[500]">{email.slice(0, 20)}{email.length > 20 ? "…" : ""}</span></div>
                <div className="flex justify-between py-[7px] border-b border-[#ECEAE3]"><span className="text-[11px] text-[#8c8a84]">表示名</span><span className="text-[12px] font-[500]">{displayName || "未設定"}</span></div>
                <div className="flex justify-between py-[7px]"><span className="text-[11px] text-[#8c8a84]">個人情報</span><span className="text-[12px] text-[#8c8a84]">{phone || address || region || bio ? "入力済み" : "未入力（任意）"}</span></div>
              </MCard>
              <MCard>
                <div className="flex justify-between items-center mb-[10px]">
                  <span className="text-[12px] font-[600] text-[#8c8a84]">アイコン・表示モード</span>
                  <button type="button" onClick={() => setPStep(2)} className="text-[12px] text-[#2B3A6B] font-[500]">編集</button>
                </div>
                <div className="flex gap-[14px] mb-[8px]">
                  {[{ url: pAvatarUrl, label: "参加者用" }, { url: oModeAvatarUrl, label: "主催者用" }].map(({ url, label }) => (
                    <div key={label} className="flex flex-col items-center gap-[4px]">
                      <div className="w-[38px] h-[38px] rounded-full overflow-hidden border-[2px] border-[#DEDAD2]">
                        <AvatarImg url={url} size={38} initials={initials} />
                      </div>
                      <span className="text-[10px] text-[#8c8a84]">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[12px] text-[#2B3A6B] font-[500]">現在のモード：{activeRole === "participant" ? "参加者" : "主催者"}</div>
              </MCard>
              {pError && <p className="text-[12px] text-red-600 mb-2">{pError}</p>}
              {pSuccess && <p className="text-[12px] text-[#4fa82a] mb-2">保存しました</p>}
              <div className="h-2" />
            </div>
          )}

          {/* Organizer steps */}
          {tab === "organizer" && !isOrganizer && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle>主催者登録が必要です</MCardTitle>
                <MCardSub>主催者プロフィールを編集するには、先に主催者登録を完了してください。</MCardSub>
                <Link
                  href="/organizer/register"
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#c8a84b] px-4 text-[13px] font-[600] text-white"
                >
                  活動者登録をはじめる
                </Link>
              </MCard>
            </div>
          )}
          {tab === "organizer" && isOrganizer && oStep === 1 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle color="#86620a"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>紹介文</MCardTitle>
                <MCardSub>信頼感・雰囲気・活動内容が伝わるように記載できます</MCardSub>
                <MField>
                  <Fl>{orgNameLabel}</Fl>
                  <input type="text" value={organizationName} onChange={e => setOrganizationName(e.target.value)} placeholder={orgNamePlaceholder} className={INP} />
                  <Fh>個人名・活動名でも団体名でもOK。あとから変更できます</Fh>
                </MField>
                <MField><Fl opt>活動エリア</Fl><input type="text" value={activityArea} onChange={e => setActivityArea(e.target.value)} placeholder="例：神奈川県藤沢市 / オンライン" className={INP} /><Fh>公開プロフィールの活動地域に表示されます</Fh></MField>
                <MField><Fl opt>一言紹介</Fl><input type="text" value={shortBio} onChange={e => setShortBio(e.target.value)} placeholder="例：地域の魅力を伝える体験づくりをしています" className={INP} /><Fh>80文字程度がおすすめです（注目の主催者に表示）</Fh></MField>
                <MField><Fl opt>詳細紹介</Fl><textarea value={orgBio} onChange={e => setOrgBio(e.target.value)} placeholder="主催者について、活動への想い、参加者へのメッセージなど" className={INP + " resize-none min-h-[80px] leading-[1.7]"} /></MField>
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "organizer" && isOrganizer && oStep === 2 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle color="#86620a"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>画像</MCardTitle>
                <MCardSub>画像はアップロード後すぐにプレビューできます（未設定でもOK）</MCardSub>
                <div className="bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2] p-[11px] mb-[10px]">
                  <div className="text-[11px] font-[600] text-[#52504c] mb-[9px]">カバー画像 <span className="font-[400] text-[#8c8a84] text-[9px]">任意</span></div>
                  <div className="mb-[8px]"><CoverPreview url={coverImageUrl} height={72} /></div>
                  <button type="button" onClick={() => orgCoverRef.current?.click()} className="w-full py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex items-center justify-center gap-[5px] mb-[7px]"><UploadIco />ファイルを選択</button>
                  <input type="url" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="または URL を入力" className={INP} />
                </div>
                <div className="bg-[#F5F4EF] rounded-[10px] border border-[#DEDAD2] p-[11px] mb-[10px]">
                  <div className="text-[11px] font-[600] text-[#52504c] mb-[9px]">プロフィール画像 <span className="font-[400] text-[#8c8a84] text-[9px]">任意</span></div>
                  <div className="flex items-center gap-[11px] mb-[8px]">
                    <div className="flex-shrink-0 w-[46px] h-[46px] rounded-[10px] overflow-hidden border-[2px] border-[#DEDAD2]">
                      <AvatarImg url={orgAvatarUrl} size={46} rounded="10" initials={initials} />
                    </div>
                    <button type="button" onClick={() => orgAvatarRef.current?.click()} className="flex-1 py-[7px] rounded-[8px] border border-[#DEDAD2] bg-white text-[11px] flex items-center justify-center gap-[5px]"><UploadIco />ファイルを選択</button>
                  </div>
                  <input type="url" value={orgAvatarUrl} onChange={e => setOrgAvatarUrl(e.target.value)} placeholder="または URL を入力" className={INP} />
                </div>
                <MField>
                  <Fl opt>ギャラリー（最大6枚）</Fl>
                  <div className="grid grid-cols-3 gap-[7px]">
                    {galleryImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-[8px] overflow-hidden border border-[#DEDAD2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setGalleryImages(p => p.filter((_, i) => i !== idx))} className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center">×</button>
                      </div>
                    ))}
                    {galleryImages.length < 6 && (
                      <button type="button" onClick={() => orgGalleryRef.current?.click()} className="aspect-square rounded-[8px] border-[1.5px] border-dashed border-[#DEDAD2] bg-[#F5F4EF] flex items-center justify-center text-[18px] text-[#8c8a84]">＋</button>
                    )}
                  </div>
                </MField>
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "organizer" && isOrganizer && oStep === 3 && (
            <div className="px-3 pt-3 pb-2">
              <MCard>
                <MCardTitle color="#86620a"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>SNS / 外部リンク</MCardTitle>
                <MCardSub>すべて任意です</MCardSub>
                {[
                  { bg: "#F3F2EE", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8c8a84" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>, v: websiteUrl, set: setWebsiteUrl, ph: "公式サイト URL" },
                  { bg: "#fce4ec", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2185b" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>, v: instagramUrl, set: setInstagramUrl, ph: "Instagram URL" },
                  { bg: "#F3F2EE", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"><path d="M4 4l16 16M4 20L20 4" /></svg>, v: xUrl, set: setXUrl, ph: "X（Twitter）URL" },
                  { bg: "#e8eaf6", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3949ab" strokeWidth="2" strokeLinecap="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>, v: facebookUrl, set: setFacebookUrl, ph: "Facebook URL" },
                ].map(({ bg, icon, v, set, ph }, i) => (
                  <div key={i} className="flex items-center gap-[8px] mb-[9px] last:mb-0">
                    <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>{icon}</div>
                    <input type="url" value={v} onChange={e => set(e.target.value)} placeholder={ph} className={INP} />
                  </div>
                ))}
              </MCard>
              <MCard>
                <MCardTitle color="#86620a"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 9.27a2 2 0 012-2.18h3" /></svg>公開連絡先</MCardTitle>
                <MCardSub>公開ONのものだけ主催者ページに表示されます（電話番号は非公開推奨）</MCardSub>
                <MField>
                  <Fl opt>公開メール</Fl>
                  <input type="email" value={publicEmail} onChange={e => setPublicEmail(e.target.value)} placeholder="contact@example.com" className={INP} />
                  <label className="flex items-center gap-[7px] text-[12px] cursor-pointer mt-[6px]">
                    <input type="checkbox" checked={showEmail} onChange={e => setShowEmail(e.target.checked)} className="accent-[#2B3A6B] w-[15px] h-[15px]" />メールを公開する
                  </label>
                </MField>
                <MField>
                  <Fl opt>公開電話番号</Fl>
                  <input type="tel" value={publicPhone} onChange={e => setPublicPhone(e.target.value)} placeholder="090-1234-5678" className={INP} />
                  <label className="flex items-center gap-[7px] text-[12px] cursor-pointer mt-[6px]">
                    <input type="checkbox" checked={showPhone} onChange={e => setShowPhone(e.target.checked)} className="accent-[#2B3A6B] w-[15px] h-[15px]" />電話番号を公開する <span className="text-[10px] text-[#8c8a84]">（非公開推奨）</span>
                  </label>
                </MField>
              </MCard>
              <div className="h-2" />
            </div>
          )}
          {tab === "organizer" && isOrganizer && oStep === 4 && (
            <div className="px-3 pt-3 pb-2">
              {[
                { label: "紹介文", val: shortBio || orgBio ? "入力済み" : "一言紹介・詳細紹介 — 未入力", onEdit: () => setOStep(1) },
                { label: "画像", val: coverImageUrl || orgAvatarUrl ? "設定済み" : "カバー・プロフィール画像 — 未設定", onEdit: () => setOStep(2) },
                { label: "SNS / 連絡先", val: websiteUrl || instagramUrl || xUrl || facebookUrl || publicEmail ? "入力済み" : "未入力", onEdit: () => setOStep(3) },
              ].map(({ label, val, onEdit }) => (
                <MCard key={label}>
                  <div className="flex justify-between mb-[10px]">
                    <span className="text-[12px] font-[600] text-[#8c8a84]">{label}</span>
                    <button type="button" onClick={onEdit} className="text-[12px] text-[#86620a] font-[500]">編集</button>
                  </div>
                  <div className="text-[12px] text-[#8c8a84]">{val}</div>
                </MCard>
              ))}
              {oError && <p className="text-[12px] text-red-600 mb-2">{oError}</p>}
              {oSuccess && <p className="text-[12px] text-[#4fa82a] mb-2">保存しました</p>}
              <div className="h-2" />
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="shrink-0 border-t border-[#DEDAD2] bg-white px-3 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
          <div className="flex gap-[8px]">
            {((tab === "participant" && pStep > 1) || (tab === "organizer" && oStep > 1)) && (
              <button type="button"
                onClick={() => tab === "participant" ? setPStep(s => (s - 1) as PStep) : setOStep(s => (s - 1) as OStep)}
                className="flex-shrink-0 px-[16px] py-[11px] rounded-[10px] border border-[#DEDAD2] bg-white text-[13px] font-[500] flex items-center gap-[5px]">
                <ChevL /> 戻る
              </button>
            )}
            {tab === "participant" && (pStep < 4 ? (
              <button type="button" onClick={() => setPStep(s => (s + 1) as PStep)}
                className="flex-1 py-[11px] rounded-[10px] bg-[#2B3A6B] text-white text-[13px] font-[600] flex items-center justify-center gap-[5px]">
                {pStep === 1 ? "アイコン設定へ" : pStep === 2 ? "表示モードへ" : "確認・保存へ"} <ChevR />
              </button>
            ) : (
              <button type="button" onClick={saveParticipant} disabled={pSaving}
                className="flex-1 py-[11px] rounded-[10px] bg-[#4fa82a] text-white text-[13px] font-[600] flex items-center justify-center gap-[5px] disabled:opacity-50">
                <CheckIco /> {pSaving ? "保存中..." : "保存する"}
              </button>
            ))}
            {tab === "organizer" && isOrganizer && (oStep < 4 ? (
              <button type="button" onClick={() => setOStep(s => (s + 1) as OStep)}
                className="flex-1 py-[11px] rounded-[10px] bg-[#c8a84b] text-white text-[13px] font-[600] flex items-center justify-center gap-[5px]">
                {oStep === 1 ? "画像設定へ" : oStep === 2 ? "SNS/連絡先へ" : "確認・保存へ"} <ChevR />
              </button>
            ) : (
              <button type="button" onClick={saveOrganizer} disabled={oSaving}
                className="flex-1 py-[11px] rounded-[10px] bg-[#c8a84b] text-white text-[13px] font-[600] flex items-center justify-center gap-[5px] disabled:opacity-50">
                <CheckIco /> {oSaving ? "保存中..." : "保存する"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PC ══ */}
      <div className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:w-full min-[900px]:flex-col min-[900px]:overflow-hidden">
        {/* Page header */}
        <div className="flex shrink-0 items-center gap-3 border-b bg-white px-5 py-2" style={{ borderColor: PC.border }}>
          <button
            type="button"
            onClick={goBackOrSkip}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-[#F7FAFC]"
            style={{ borderColor: PC.border, color: PC.muted }}
            aria-label={fromSignup ? "あとで整える" : "マイページへ戻る"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] font-bold leading-tight" style={{ color: PC.ink }}>
              {fromSignup ? "プロフィールを整える" : "プロフィール編集"}
            </h1>
            <p className="text-[11px] leading-tight" style={{ color: PC.muted }}>
              {fromSignup ? "あとからいつでも変更できます" : "あなたの情報を登録・更新できます"}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={goBackOrSkip}
              className="rounded-[8px] border bg-white px-3 py-1.5 text-[12px] transition-colors hover:bg-[#F7FAFC]"
              style={{ borderColor: PC.border, color: PC.ink }}
            >
              {fromSignup ? "あとで整える" : "キャンセル"}
            </button>
            <button
              type="button"
              onClick={tab === "participant" ? saveParticipant : saveOrganizer}
              disabled={tab === "participant" ? pSaving : oSaving}
              className="flex items-center gap-1 rounded-[8px] px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: tab === "participant" ? PC.green : PC.pro }}
            >
              <CheckIco size={12} />
              {(tab === "participant" ? pSaving : oSaving) ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>

        {/* Profile tab bar */}
        <div className="flex shrink-0 border-b bg-white px-5" style={{ borderColor: PC.border }}>
          <button type="button" onClick={() => setTab("participant")}
            className={["flex items-center gap-1.5 border-b-2 px-4 py-2 text-[12px] font-medium transition-all",
              tab === "participant" ? "border-[#2B3A6B] text-[#2B3A6B]" : "border-transparent hover:text-[#2D3748]"].join(" ")}
            style={{ color: tab === "participant" ? PC.navy : PC.muted }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            参加者プロフィール
            <span className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", tab === "participant" ? "bg-[#EBF8FF] text-[#2B6CB0]" : "bg-[#EDF2F7] text-[#718096]"].join(" ")}>基本</span>
          </button>
          <button type="button" onClick={() => setTab("organizer")}
            className={["flex items-center gap-1.5 border-b-2 px-4 py-2 text-[12px] font-medium transition-all",
              tab === "organizer" ? "border-[#ED8936] text-[#C05621]" : "border-transparent hover:text-[#2D3748]"].join(" ")}
            style={{ color: tab === "organizer" ? "#C05621" : PC.muted }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-4 0v2M8 7V5a2 2 0 00-4 0v2" /></svg>
            主催者プロフィール
            <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold", tab === "organizer" ? "text-[#C05621]" : "text-[#ED8936]"].join(" ")} style={{ backgroundColor: PC.proSoft }}>PRO</span>
          </button>
        </div>

        {/* Participant panels */}
        {tab === "participant" && (
          <div className="min-h-0 flex-1 overflow-hidden p-3" style={{ backgroundColor: PC.page }}>
            <div className="grid h-full min-h-0 grid-cols-3 gap-3">
              {/* Left: 基本情報 */}
              <PcCol>
                <PcCard className="flex flex-col gap-2.5">
                  <PcSectionTitle
                    icBg="#EBF8FF"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3182CE" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  >
                    基本情報
                  </PcSectionTitle>
                  <PcField label="メールアドレス" hint="変更はできません">
                    <input type="email" value={email} disabled className={INP_PC} />
                  </PcField>
                  <PcField label="表示名">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="例: 山田 太郎"
                      className={INP_PC}
                    />
                  </PcField>
                  <div className="h-px shrink-0" style={{ backgroundColor: PC.border }} />
                  <PcSectionTitle
                    icBg="#EDF2F7"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    }
                    opt="任意"
                  >
                    個人情報
                  </PcSectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    <PcField label="電話番号" opt>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-1234-5678" className={INP_PC} />
                    </PcField>
                    <PcField label="地域" opt>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="東京都渋谷区" className={INP_PC} />
                    </PcField>
                  </div>
                  <PcField label="住所" opt>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="例: 〇〇町1-2-3" className={INP_PC} />
                  </PcField>
                  <PcField label="自己紹介" opt>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="あなたについて簡単に紹介してください"
                      rows={2}
                      className={INP_PC + " min-h-[44px] resize-none leading-snug"}
                    />
                  </PcField>
                  {pError && <p className="text-[12px] text-red-600">{pError}</p>}
                  {pSuccess && <p className="text-[12px] font-medium" style={{ color: PC.green }}>保存しました</p>}
                </PcCard>
              </PcCol>

              {/* Middle: アイコン・表示モード */}
              <PcCol>
                <PcCard className="flex flex-col gap-2.5">
                  <PcSectionTitle
                    icBg="#FFFAF0"
                    icon={
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DD6B20" strokeWidth="2" strokeLinecap="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    }
                    opt="任意"
                  >
                    アイコン設定
                  </PcSectionTitle>
                  <PcIconBlock
                    label="参加者用アイコン"
                    url={pAvatarUrl}
                    onFile={() => pFileRef.current?.click()}
                    onCamera={() => pCamRef.current?.click()}
                    urlValue={pAvatarUrl}
                    onUrlChange={setPAvatarUrl}
                    initials={initials}
                  />
                  <PcIconBlock
                    label="主催者用アイコン"
                    url={oModeAvatarUrl}
                    onFile={() => oModeFileRef.current?.click()}
                    onCamera={() => oModeCamRef.current?.click()}
                    urlValue={oModeAvatarUrl}
                    onUrlChange={setOModeAvatarUrl}
                    initials={initials}
                  />
                  <div className="h-px shrink-0" style={{ backgroundColor: PC.border }} />
                  <PcSectionTitle
                    icBg="#E6FFFA"
                    icon={
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#319795" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    }
                  >
                    表示モード
                  </PcSectionTitle>
                  <div className="flex gap-1.5">
                    {(["participant", "organizer"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setActiveRole(r)}
                        className={[
                          "flex-1 rounded-full border py-1.5 text-[12px] font-semibold transition-all",
                          activeRole === r
                            ? "border-[#2B3A6B] bg-[#2B3A6B] text-white"
                            : "border-[#E2E8F0] bg-white text-[#718096]",
                        ].join(" ")}
                      >
                        {r === "participant" ? "参加者" : "主催者"}
                      </button>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-[8px] border px-2 py-1.5"
                    style={{ borderColor: PC.infoTealBorder, backgroundColor: PC.infoTeal }}
                  >
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white">
                      <AvatarImg url={activeRole === "participant" ? pAvatarUrl : oModeAvatarUrl} size={24} initials={initials} />
                    </div>
                    <p className="text-[10px] leading-snug" style={{ color: PC.infoTealInk }}>
                      {activeRole === "participant"
                        ? "参加者モード — 参加者用アイコンを表示"
                        : "主催者モード — 主催者用アイコンを表示"}
                    </p>
                  </div>
                </PcCard>
              </PcCol>

              {/* Right: 進捗・案内 */}
              <PcCol className="justify-between gap-2">
                <div className="flex min-h-0 flex-col gap-2">
                  <PcCard className="flex flex-col gap-2">
                    <PcSectionTitle
                      icBg="#F0FFF4"
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38A169" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                      }
                    >
                      入力の進捗
                    </PcSectionTitle>
                    <PcProgressList
                      items={[
                        { label: "メールアドレス", done: !!email, st: email ? "✓" : "未入力" },
                        { label: "表示名", done: !!displayName, st: displayName ? "✓" : "未入力" },
                        { label: "参加者用アイコン", done: !!pAvatarUrl, st: "任意" },
                        { label: "主催者用アイコン", done: !!oModeAvatarUrl, st: "任意" },
                        { label: "表示モード", done: true, st: activeRole === "participant" ? "参加者" : "主催者" },
                        {
                          label: "個人情報（任意）",
                          done: !!(phone || address || region || bio),
                          st: phone || address || region || bio ? "入力済み" : "未入力",
                        },
                      ]}
                    />
                  </PcCard>
                  <div className="flex shrink-0 flex-col gap-2">
                    <PcInfoCallout variant="blue" title="アイコンについて">
                      参加者用・主催者用で別々に設定できます。表示モードで切り替わります。
                    </PcInfoCallout>
                    <PcInfoCallout variant="green" title="プライバシー">
                      住所・電話番号は他のユーザーには表示されません。
                    </PcInfoCallout>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveParticipant}
                  disabled={pSaving}
                  className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: PC.green }}
                >
                  <CheckIco size={13} />
                  {pSaving ? "保存中..." : "変更を保存する"}
                </button>
              </PcCol>
            </div>
          </div>
        )}

        {/* Organizer panels */}
        {tab === "organizer" && (!isOrganizer ? (
          <div className="flex flex-1 items-center justify-center" style={{ backgroundColor: PC.page }}>
            <PcCard>
              <p className="text-[14px] font-medium text-[#18181a]">主催者登録が必要です</p>
              <p className="mt-1 text-[12px] text-[#8c8a84]">
                主催者プロフィールを編集するには、先に主催者登録を完了してください。
              </p>
              <Link
                href="/organizer/register"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[8px] px-4 text-[13px] font-semibold text-white"
                style={{ backgroundColor: PC.pro }}
              >
                活動者登録をはじめる
              </Link>
            </PcCard>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden p-3" style={{ backgroundColor: PC.page }}>
            <div className="grid h-full min-h-0 grid-cols-3 gap-3">
              {/* Left: 紹介文 */}
              <PcCol>
                <PcCard className="flex flex-col gap-2.5">
                  <PcSectionTitle
                    icBg="#FFFAF0"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DD6B20" strokeWidth="2" strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    }
                  >
                    紹介文
                  </PcSectionTitle>
                  <p className="text-[10px] leading-snug" style={{ color: PC.muted }}>
                    信頼感・雰囲気・活動内容が伝わるように記載できます
                  </p>
                  <PcField
                    label={orgNameLabel}
                    hint="個人名・活動名でも団体名でもOK。あとから変更できます"
                  >
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={orgNamePlaceholder}
                      className={INP_PC}
                    />
                  </PcField>
                  <PcField label="活動エリア" opt hint="公開プロフィールの活動地域に表示されます">
                    <input
                      type="text"
                      value={activityArea}
                      onChange={(e) => setActivityArea(e.target.value)}
                      placeholder="例：神奈川県藤沢市 / オンライン"
                      className={INP_PC}
                    />
                  </PcField>
                  <PcField label="一言紹介" opt hint="80文字程度がおすすめです（注目の主催者に表示）">
                    <input
                      type="text"
                      value={shortBio}
                      onChange={(e) => setShortBio(e.target.value)}
                      placeholder="例：地域の魅力を伝える体験づくりをしています"
                      className={INP_PC}
                    />
                  </PcField>
                  <PcField label="詳細紹介" opt>
                    <textarea
                      value={orgBio}
                      onChange={(e) => setOrgBio(e.target.value)}
                      placeholder="主催者について、活動への想い、参加者へのメッセージなど"
                      rows={3}
                      className={INP_PC + " min-h-[56px] resize-none leading-snug"}
                    />
                  </PcField>
                  {oError && <p className="text-[11px] text-red-600">{oError}</p>}
                  {oSuccess && <p className="text-[11px] font-medium" style={{ color: PC.green }}>保存しました</p>}
                </PcCard>
              </PcCol>
              {/* Middle: 画像 */}
              <PcCol>
                <PcCard className="flex flex-col gap-2.5">
                  <PcSectionTitle icBg="#FFFAF0" icon={<ImgIco stroke="#DD6B20" />} opt="任意">
                    画像
                  </PcSectionTitle>
                  <p className="text-[10px] leading-snug" style={{ color: PC.muted }}>
                    画像はアップロード後すぐにプレビューできます（未設定でもOK）
                  </p>
                  <div className="rounded-[10px] border p-3" style={{ borderColor: PC.border, backgroundColor: PC.inset }}>
                    <div className="mb-2 text-[12px] font-semibold" style={{ color: PC.ink }}>
                      カバー画像 <span className="font-normal" style={{ color: PC.muted }}>任意</span>
                    </div>
                    <div className="mb-2">
                      <CoverPreview url={coverImageUrl} height={56} />
                    </div>
                    <button
                      type="button"
                      onClick={() => orgCoverRef.current?.click()}
                      className="mb-2 flex items-center gap-1 rounded-[7px] border border-[#DEDAD2] bg-white px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eae8e2]"
                    >
                      <UploadIco />
                      ファイルを選択
                    </button>
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="または URL を入力"
                      className={INP_PC}
                    />
                  </div>
                  <div className="rounded-[10px] border p-3" style={{ borderColor: PC.border, backgroundColor: PC.inset }}>
                    <div className="mb-2 text-[12px] font-semibold" style={{ color: PC.ink }}>
                      プロフィール画像 <span className="font-normal" style={{ color: PC.muted }}>任意</span>
                    </div>
                    <div className="mb-2 flex items-center gap-2.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border-2 border-[#DEDAD2]">
                        <AvatarImg url={orgAvatarUrl} size={44} rounded="10" initials={initials} />
                      </div>
                      <button
                        type="button"
                        onClick={() => orgAvatarRef.current?.click()}
                        className="flex items-center gap-1 rounded-[7px] border border-[#DEDAD2] bg-white px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eae8e2]"
                      >
                        <UploadIco />
                        ファイルを選択
                      </button>
                    </div>
                    <input
                      type="url"
                      value={orgAvatarUrl}
                      onChange={(e) => setOrgAvatarUrl(e.target.value)}
                      placeholder="または URL を入力"
                      className={INP_PC}
                    />
                  </div>
                  <PcField label="ギャラリー" opt>
                    <div className="grid grid-cols-3 gap-1.5">
                      {galleryImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-[8px] border border-[#DEDAD2]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setGalleryImages((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {galleryImages.length < 6 && (
                        <button
                          type="button"
                          onClick={() => orgGalleryRef.current?.click()}
                          className="flex aspect-square items-center justify-center rounded-[8px] border border-dashed border-[#DEDAD2] bg-[#F5F4EF] text-[11px] text-[#8c8a84] transition-colors hover:border-[#2B3A6B]"
                        >
                          ＋
                        </button>
                      )}
                    </div>
                  </PcField>
                </PcCard>
              </PcCol>
              {/* Right: SNS・連絡先 */}
              <PcCol className="justify-between gap-2">
                <PcCard className="flex flex-col gap-2.5">
                  <PcSectionTitle
                    icBg="#EDF2F7"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                    }
                    opt="任意"
                  >
                    SNS / 外部リンク
                  </PcSectionTitle>
                  <SnsRow
                    bg="#F3F2EE"
                    icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8c8a84" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                      </svg>
                    }
                    value={websiteUrl}
                    onChange={setWebsiteUrl}
                    placeholder="公式サイト URL"
                  />
                  <SnsRow
                    bg="#fce4ec"
                    icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2185b" strokeWidth="2" strokeLinecap="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    }
                    value={instagramUrl}
                    onChange={setInstagramUrl}
                    placeholder="Instagram URL"
                  />
                  <SnsRow
                    bg="#F3F2EE"
                    icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4l16 16M4 20L20 4" />
                      </svg>
                    }
                    value={xUrl}
                    onChange={setXUrl}
                    placeholder="X（Twitter）URL"
                  />
                  <SnsRow
                    bg="#e8eaf6"
                    icon={
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3949ab" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                      </svg>
                    }
                    value={facebookUrl}
                    onChange={setFacebookUrl}
                    placeholder="Facebook URL"
                  />
                  <div className="h-px" style={{ backgroundColor: PC.border }} />
                  <PcSectionTitle
                    icBg="#EDF2F7"
                    icon={
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 9.27a2 2 0 012-2.18h3" />
                      </svg>
                    }
                    opt="任意"
                  >
                    公開連絡先
                  </PcSectionTitle>
                  <p className="text-[10px] leading-snug" style={{ color: PC.muted }}>
                    公開ONのものだけ主催者ページに表示されます
                  </p>
                  <PcField label="公開メール">
                    <input
                      type="email"
                      value={publicEmail}
                      onChange={(e) => setPublicEmail(e.target.value)}
                      placeholder="contact@example.com"
                      className={INP_PC}
                    />
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={showEmail}
                        onChange={(e) => setShowEmail(e.target.checked)}
                        className="h-[15px] w-[15px] cursor-pointer accent-[#2B3A6B]"
                      />
                      メールを公開する
                    </label>
                  </PcField>
                  <PcField label="公開電話番号">
                    <input
                      type="tel"
                      value={publicPhone}
                      onChange={(e) => setPublicPhone(e.target.value)}
                      placeholder="090-1234-5678"
                      className={INP_PC}
                    />
                    <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-[13px]">
                      <input
                        type="checkbox"
                        checked={showPhone}
                        onChange={(e) => setShowPhone(e.target.checked)}
                        className="h-[15px] w-[15px] cursor-pointer accent-[#2B3A6B]"
                      />
                      電話番号を公開する
                      <span className="text-[10px] text-[#8c8a84]">（非公開推奨）</span>
                    </label>
                  </PcField>
                </PcCard>
                <button
                  type="button"
                  onClick={saveOrganizer}
                  disabled={oSaving}
                  className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: PC.pro }}
                >
                  <CheckIco size={13} />
                  {oSaving ? "保存中..." : "変更を保存する"}
                </button>
              </PcCol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-[13px] text-[#8c8a84]">読み込み中...</p>
        </div>
      }
    >
      <ProfileEditPageInner />
    </Suspense>
  );
}
