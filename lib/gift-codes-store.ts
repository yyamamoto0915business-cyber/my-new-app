/** ギフトコードの一時ストア（開発用・インメモリ） */
export type GiftCode = {
  id: string;
  code: string;
  eventId: string;
  senderUserId: string | null;
  recipientEmail: string | null;
  recipientName: string | null;
  message: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

const giftCodes: GiftCode[] = [];
let nextId = 1;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createGiftCode(data: {
  eventId: string;
  senderUserId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  message?: string | null;
  expiresInDays?: number;
}): GiftCode {
  const id = `gift-${nextId++}`;
  const now = new Date();
  const expiresAt = data.expiresInDays
    ? new Date(now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  let code: string;
  do {
    code = generateCode();
  } while (giftCodes.some((g) => g.code === code));

  const gift: GiftCode = {
    id,
    code,
    eventId: data.eventId,
    senderUserId: data.senderUserId ?? null,
    recipientEmail: data.recipientEmail ?? null,
    recipientName: data.recipientName ?? null,
    message: data.message ?? null,
    usedBy: null,
    usedAt: null,
    expiresAt,
    createdAt: now.toISOString(),
  };
  giftCodes.push(gift);
  return gift;
}

export function getGiftCode(code: string): GiftCode | null {
  return giftCodes.find((g) => g.code === code && !g.usedAt) ?? null;
}

export function useGiftCode(code: string, userId: string): boolean {
  const gift = giftCodes.find((g) => g.code === code);
  if (!gift || gift.usedAt) return false;
  gift.usedBy = userId;
  gift.usedAt = new Date().toISOString();
  return true;
}
