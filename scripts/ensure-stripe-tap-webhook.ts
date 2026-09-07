/**
 * 既存 Webhook に payment_intent.succeeded を足す（カードタッチ完了用）
 *
 * 実行: npx tsx scripts/ensure-stripe-tap-webhook.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import Stripe from "stripe";

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

const NEEDED = "payment_intent.succeeded";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.error("STRIPE_SECRET_KEY がありません");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const list = await stripe.webhookEndpoints.list({ limit: 30 });
  const targets = list.data.filter((ep) =>
    /\/api\/stripe\/webhook\/?$/.test(ep.url)
  );

  if (targets.length === 0) {
    console.log("対象の Webhook（/api/stripe/webhook）が見つかりませんでした。");
    console.log("Dashboard で URL を確認してください。");
    for (const ep of list.data) {
      console.log(`- ${ep.id} ${ep.status} ${ep.url}`);
    }
    process.exit(1);
  }

  for (const ep of targets) {
    const events = ep.enabled_events ?? [];
    const hasAll = events.includes("*");
    const hasPi = events.includes(NEEDED);
    if (hasAll || hasPi) {
      console.log(`${ep.id} はすでに ${NEEDED} を受け取っています (${ep.url})`);
      continue;
    }
    const nextEvents = [
      ...events,
      NEEDED,
    ] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
    await stripe.webhookEndpoints.update(ep.id, { enabled_events: nextEvents });
    console.log(`${ep.id} に ${NEEDED} を追加しました (${ep.url})`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
