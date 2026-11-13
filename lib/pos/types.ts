export const POS_CATEGORIES = [
  { id: "all", label: "すべて" },
  { id: "food", label: "フード" },
  { id: "drink", label: "ドリンク" },
  { id: "ticket", label: "チケット" },
  { id: "goods", label: "グッズ" },
  { id: "other", label: "その他" },
] as const;

export type PosCategoryId = Exclude<(typeof POS_CATEGORIES)[number]["id"], "all">;

export type PosProduct = {
  id: string;
  organizerId: string;
  eventId: string | null;
  name: string;
  priceYen: number;
  category: PosCategoryId;
  imageUrl: string | null;
  /** イベントポイントで交換できるときの pt（null：交換しない） */
  pointPrice: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PosPaymentMethod = "cash" | "online" | "tap";

export type PosSaleStatus = "pending" | "paid" | "cancelled" | "refunded";

export type PosSaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  productName: string;
  unitPriceYen: number;
  quantity: number;
  lineTotalYen: number;
  /** この行でイベントポイントを使った分 */
  pointsUsed: number;
};

export type PosSale = {
  id: string;
  organizerId: string;
  eventId: string | null;
  paymentMethod: PosPaymentMethod;
  status: PosSaleStatus;
  totalYen: number;
  cashReceivedYen: number | null;
  cashChangeYen: number | null;
  platformFeeYen: number;
  organizerNetYen: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
  /** この会計でイベントポイントを使った分（0：使っていない） */
  pointsUsed: number;
  pointsUserId: string | null;
  /** ポイントをお会計の割引に使って引いた金額（0：割引なし）。totalYen は割引のあと */
  pointsDiscountYen: number;
  items?: PosSaleItem[];
};

export type PosCartLine = {
  productId: string;
  name: string;
  unitPriceYen: number;
  imageUrl: string | null;
  pointPrice: number | null;
  quantity: number;
};

export type PosSalesSummary = {
  totalYen: number;
  cashYen: number;
  onlineYen: number;
  saleCount: number;
  platformFeeYen: number;
  /** ポイント割引で引いた合計（商品ごとの売上は定価なので、その差） */
  pointsDiscountYen: number;
  byProduct: Array<{
    productId: string | null;
    productName: string;
    quantity: number;
    totalYen: number;
  }>;
};

export function formatYen(value: number): string {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

export function categoryLabel(id: string): string {
  return POS_CATEGORIES.find((c) => c.id === id)?.label ?? "その他";
}
