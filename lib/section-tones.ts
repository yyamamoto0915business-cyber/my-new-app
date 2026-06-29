/** 主催者設定・マイページで共通のセクション色 */
export type SectionTone =
  | "plan"
  | "payout"
  | "account"
  | "organizer"
  | "display"
  | "notification"
  | "security";

export const SECTION_TONES: Record<
  SectionTone,
  {
    header: string;
    headerText: string;
    icon: string;
    border: string;
    bodyBg: string;
    infoBg: string;
    infoBorder: string;
    label: string;
    desc: string;
    btnBorder: string;
    btnText: string;
    btnHover: string;
  }
> = {
  plan: {
    header: "#F5E6B8",
    headerText: "#6B4E10",
    icon: "#7A5800",
    border: "#E8D9A8",
    bodyBg: "#FFFCF5",
    infoBg: "#FFFBF0",
    infoBorder: "#E8D9A8",
    label: "#9a7b20",
    desc: "#7A5800",
    btnBorder: "#E8D9A8",
    btnText: "#7A5800",
    btnHover: "#FFF8EC",
  },
  payout: {
    header: "#FADCE6",
    headerText: "#9a3050",
    icon: "#b84060",
    border: "#F0C4D4",
    bodyBg: "#FFFAFC",
    infoBg: "#FEF6F8",
    infoBorder: "#F0C4D4",
    label: "#c04060",
    desc: "#8a5060",
    btnBorder: "#F0C4D4",
    btnText: "#2B3A6B",
    btnHover: "#FEF0F3",
  },
  account: {
    header: "#2B3A6B",
    headerText: "#ffffff",
    icon: "#ffffff",
    border: "#C5DBE8",
    bodyBg: "#FAFCFF",
    infoBg: "#EEF4FB",
    infoBorder: "#C5DBE8",
    label: "#5a7a9a",
    desc: "#5a6a7a",
    btnBorder: "#C5DBE8",
    btnText: "#2B3A6B",
    btnHover: "#EEF4FB",
  },
  organizer: {
    header: "#3d7a52",
    headerText: "#ffffff",
    icon: "#ffffff",
    border: "#B8DEB0",
    bodyBg: "#F8FCF6",
    infoBg: "#EAF6DE",
    infoBorder: "#B8DEB0",
    label: "#4a7a58",
    desc: "#5a6a58",
    btnBorder: "#B8DEB0",
    btnText: "#2d5c3a",
    btnHover: "#EAF6DE",
  },
  display: {
    header: "#5c6b8a",
    headerText: "#ffffff",
    icon: "#ffffff",
    border: "#D0D8E8",
    bodyBg: "#FAFBFD",
    infoBg: "#F0F3F8",
    infoBorder: "#D0D8E8",
    label: "#6a7588",
    desc: "#6a7588",
    btnBorder: "#D0D8E8",
    btnText: "#4a5568",
    btnHover: "#F0F3F8",
  },
  notification: {
    header: "#D8E8F4",
    headerText: "#2B3A6B",
    icon: "#5a8ab0",
    border: "#C5DBE8",
    bodyBg: "#FAFCFF",
    infoBg: "#EEF4FB",
    infoBorder: "#C5DBE8",
    label: "#5a7a9a",
    desc: "#5a6a7a",
    btnBorder: "#C5DBE8",
    btnText: "#2B3A6B",
    btnHover: "#EEF4FB",
  },
  security: {
    header: "#7a5c42",
    headerText: "#ffffff",
    icon: "#ffffff",
    border: "#E0D0C0",
    bodyBg: "#FFFBF8",
    infoBg: "#F5F0EA",
    infoBorder: "#E0D0C0",
    label: "#8a7060",
    desc: "#7a6a58",
    btnBorder: "#E0D0C0",
    btnText: "#6B4E10",
    btnHover: "#F5F0EA",
  },
};
