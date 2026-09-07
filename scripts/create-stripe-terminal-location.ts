/**
 * Stripe Terminal の日本 Location を1件作り、ID を表示する。
 *
 * 実行: npm run pos:tap-location
 * 出力された tml_... を .env.local と Vercel の STRIPE_TERMINAL_LOCATION_ID に入れる。
 */
import { readFileSync } from "fs";
import { join } from "path";
import Stripe from "stripe";
import { LEGAL_ENTITY, SERVICE_TRADE_NAME } from "../lib/legal";

try {
  const envPath = join(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  /* .env.local がなくても続行 */
}

const POSTAL = process.env.STRIPE_TERMINAL_POSTAL_CODE?.trim() || "179-0074";

function toE164Jp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("81")) return `+${digits}`;
  if (digits.startsWith("0")) return `+81${digits.slice(1)}`;
  return `+81${digits}`;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.error("STRIPE_SECRET_KEY を .env.local に設定してください");
    process.exit(1);
  }

  const existing = process.env.STRIPE_TERMINAL_LOCATION_ID?.trim();
  if (existing) {
    console.log(`すでに STRIPE_TERMINAL_LOCATION_ID=${existing} があります。上書きしません。`);
    process.exit(0);
  }

  const stripe = new Stripe(key);
  const location = await stripe.terminal.locations.create({
    display_name: `${SERVICE_TRADE_NAME} POS`,
    display_name_kanji: "まちグリフ レジ",
    display_name_kana: "マチグリフ レジ",
    address_kanji: {
      line1: "1-31-7",
      town: "春日町",
      city: "練馬区",
      state: "東京都",
      postal_code: POSTAL,
      country: "JP",
    },
    address_kana: {
      line1: "1-31-7",
      town: "カスガチョウ",
      city: "ネリマク",
      state: "トウキョウト",
      postal_code: POSTAL.replace("-", ""),
      country: "JP",
    },
    phone: toE164Jp(LEGAL_ENTITY.phone),
  });

  console.log("Stripe Terminal Location を作成しました。");
  console.log(`STRIPE_TERMINAL_LOCATION_ID=${location.id}`);
  console.log(".env.local と Vercel の環境変数に保存し、再デプロイしてください。");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
