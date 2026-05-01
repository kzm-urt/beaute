import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";

function subscriptionToProfileFields(sub: Stripe.Subscription) {
  return {
    is_pro: ["active", "trialing"].includes(sub.status),
    stripe_subscription_id: sub.id,
    stripe_subscription_status: sub.status,
    stripe_current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    stripe_cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "署名ヘッダーがありません" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error("Webhook署名検証エラー:", e);
    return NextResponse.json({ error: "署名が無効です" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        let subscriptionFields = {
          is_pro: true,
          stripe_subscription_id: subscriptionId,
          stripe_subscription_status: "active",
          stripe_current_period_end: null as string | null,
          stripe_cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        };

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionFields = subscriptionToProfileFields(subscription);
        }

        if (userId) {
          await supabase.from("profiles").upsert({
            id: userId,
            stripe_customer_id: customerId,
            ...subscriptionFields,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (data) {
          await supabase
            .from("profiles")
            .update({
              ...subscriptionToProfileFields(sub),
              is_pro: false,
              stripe_subscription_status: "deleted",
            })
            .eq("id", data.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (data) {
          await supabase
            .from("profiles")
            .update(subscriptionToProfileFields(sub))
            .eq("id", data.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (data) {
          await supabase
            .from("profiles")
            .update({
              is_pro: false,
              stripe_subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhookハンドラーエラー:", e);
    return NextResponse.json({ error: "内部エラー" }, { status: 500 });
  }
}
