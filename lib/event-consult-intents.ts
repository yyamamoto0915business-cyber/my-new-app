import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  Users,
  ShoppingBag,
  MapPin,
  CloudRain,
  HandHeart,
  CircleX,
  Ellipsis,
} from "lucide-react";

export type EventConsultIntent = {
  id: string;
  label: string;
  template: string;
  icon: LucideIcon;
};

export const EVENT_CONSULT_INTENTS: EventConsultIntent[] = [
  {
    id: "question",
    label: "質問したい",
    template: "イベントについて質問したいです。",
    icon: CircleHelp,
  },
  {
    id: "consult",
    label: "参加相談",
    template: "参加について相談したいです。",
    icon: Users,
  },
  {
    id: "bring",
    label: "持ち物",
    template: "持ち物について教えてください。",
    icon: ShoppingBag,
  },
  {
    id: "meeting",
    label: "集合場所",
    template: "集合場所はどちらでしょうか。",
    icon: MapPin,
  },
  {
    id: "weather",
    label: "雨天時",
    template: "雨天時は開催されますか？",
    icon: CloudRain,
  },
  {
    id: "volunteer",
    label: "ボランティア",
    template: "ボランティア参加は可能でしょうか。",
    icon: HandHeart,
  },
  {
    id: "cancel",
    label: "キャンセルを相談したい",
    template: "キャンセル方法について確認したいです。",
    icon: CircleX,
  },
  {
    id: "other",
    label: "その他",
    template: "",
    icon: Ellipsis,
  },
];

/** モバイル相談モーダルの文字数上限 */
export const EVENT_CONSULT_MESSAGE_MAX = 1000;
/** PC相談モーダルの文字数上限 */
export const EVENT_CONSULT_MESSAGE_MAX_PC = 500;
