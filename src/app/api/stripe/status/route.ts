import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { resolveIsPro } from "@/lib/plan";
import { stripe } from "@/lib/stripe";

interface ProfileBillingRow {
  is_pro?: boolean | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  stripe_current_period_end?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
}

function subscriptionToProfileFields(sub: Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>) {
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
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const user = authData.user;
    if (authError || !user) {
      return NextResponse.json({ error: "認証エラー" }, { status: 401 });
    }

    const { data } = await supabase
      .from("profiles")
      .select("is_pro, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, stripe_current_period_end, stripe_cancel_at_period_end")
      .eq("id", user.id)
      .single();
    let profile = data as ProfileBillingRow | null;

    if (profile?.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
        const fields = subscriptionToProfileFields(subscription);
        await supabase.from("profiles").update(fields).eq("id", user.id);
        profile = { ...profile, ...fields };
      } catch (error) {
        console.error("Stripe subscription sync error:", error);
      }
    }

    return NextResponse.json({
      isPro: resolveIsPro(profile?.is_pro, user.email),
      hasStripeCustomer: Boolean(profile?.stripe_customer_id),
      subscriptionId: profile?.stripe_subscription_id ?? null,
      status: profile?.stripe_subscription_status ?? null,
      currentPeriodEnd: profile?.stripe_current_period_end ?? null,
      cancelAtPeriodEnd: profile?.stripe_cancel_at_period_end ?? false,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "契約状態を取得できませんでした" }, { status: 500 });
  }
}
