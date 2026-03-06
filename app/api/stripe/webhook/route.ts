import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getStripe(): Stripe | null {
  return stripeKey ? new Stripe(stripeKey) : null;
}

async function updateOrganizerSubscription(
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
  organizerId: string,
  subscription: Stripe.Subscription | null
) {
  if (!subscription) {
    await supabase
      .from("organizers")
      .update({
        subscription_status: null,
        stripe_subscription_id: null,
        current_period_end: null,
        plan: "free",
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizerId);
    return;
  }

  const status = subscription.status;
  const items = subscription.items;
  const firstItem = Array.isArray(items?.data) ? items.data[0] : null;
  const periodEndTs = firstItem?.current_period_end ?? (subscription as { current_period_end?: number }).current_period_end;
  const periodEnd = periodEndTs
    ? new Date(periodEndTs * 1000).toISOString()
    : null;

  await supabase
    .from("organizers")
    .update({
      subscription_status: status,
      stripe_subscription_id: subscription.id,
      current_period_end: periodEnd,
      plan: status === "active" ? "starter" : "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizerId);
}

export async function POST(request: NextRequest) {
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe未設定" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe()!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const organizerId = (sub.metadata?.organizer_id ?? session.metadata?.organizer_id) as string;
          if (organizerId) {
            await updateOrganizerSubscription(supabase, organizerId, sub);
          }
        }
        if (session.mode === "payment" && session.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          const eventId = pi.metadata?.eventId as string;
          const organizerId = pi.metadata?.organizerId as string;
          const platformFeeJpy = parseInt(pi.metadata?.platformFeeJpy ?? "0", 10);
          if (eventId && organizerId) {
            const amountJpy = session.amount_total ?? 0;
            const organizerNetJpy = amountJpy - platformFeeJpy;
            const { data: existing } = await supabase
              .from("sponsorships")
              .select("id")
              .eq("stripe_checkout_session_id", session.id)
              .maybeSingle();
            if (existing) {
              await supabase
                .from("sponsorships")
                .update({
                  status: "paid",
                  amount_jpy: amountJpy,
                  platform_fee_jpy: platformFeeJpy,
                  organizer_net_jpy: organizerNetJpy,
                  receipt_url: session.url ?? null,
                  stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                })
                .eq("id", existing.id);
            } else {
              await supabase.from("sponsorships").insert({
                event_id: eventId,
                organizer_id: organizerId,
                amount_jpy: amountJpy,
                platform_fee_jpy: platformFeeJpy,
                organizer_net_jpy: organizerNetJpy,
                currency: "jpy",
                sponsor_name: session.customer_details?.name ?? null,
                sponsor_email: session.customer_details?.email ?? null,
                stripe_checkout_session_id: session.id,
                stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                status: "paid",
                receipt_url: session.url ?? null,
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const organizerId = sub.metadata?.organizer_id as string;
        if (organizerId) {
          await updateOrganizerSubscription(supabase, organizerId, sub);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const organizerId = sub.metadata?.organizer_id as string;
        if (organizerId) {
          await updateOrganizerSubscription(supabase, organizerId, null);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string;
          subscription_details?: { subscription?: string };
        };
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription_details?.subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const organizerId = sub.metadata?.organizer_id as string;
          if (organizerId) {
            await supabase
              .from("organizers")
              .update({
                subscription_status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("id", organizerId);
          }
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const { data: rows } = await supabase
          .from("organizers")
          .select("id")
          .eq("stripe_account_id", account.id);
        if (rows?.[0]) {
          await supabase
            .from("organizers")
            .update({
              stripe_account_charges_enabled: account.charges_enabled ?? false,
              stripe_account_details_submitted: account.details_submitted ?? false,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_account_id", account.id);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = charge.payment_intent as string;
        if (piId) {
          await supabase
            .from("sponsorships")
            .update({ status: "refunded", updated_at: new Date().toISOString() })
            .eq("stripe_payment_intent_id", piId);
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error:", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
