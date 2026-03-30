"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { isMockMode } from "@/lib/mock/flags";
import { supabase } from "@/lib/supabase";
import type { Business } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import {
  Activity,
  Check,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PlanKey = "MONTHLY" | "QUARTERLY" | "YEARLY";

const PLAN_DEFS: Array<{
  key: PlanKey;
  name: string;
  amountBirr: number;
  periodLabel: string;
  blurb: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    key: "MONTHLY",
    name: "Monthly",
    amountBirr: 4900,
    periodLabel: "per month",
    blurb: "Lean in fast — perfect for trying the platform with full tools.",
    features: [
      "Live booking calendar & patient-friendly slots",
      "Up to 10 services & specialist profiles",
      "Secure Chapa checkout & instant receipts",
      "Email alerts for new appointments",
    ],
  },
  {
    key: "QUARTERLY",
    name: "Quarterly",
    amountBirr: 14700,
    periodLabel: "every 3 months",
    blurb: "Serious growth — save more than paying month-to-month.",
    features: [
      "Everything in Monthly, scaled for teams",
      "Higher service & specialist limits",
      "Quarterly performance snapshot in-dashboard",
      "Priority onboarding tips from our team",
    ],
    popular: true,
  },
  {
    key: "YEARLY",
    name: "Yearly",
    amountBirr: 49000,
    periodLabel: "per year",
    blurb: "Best value — lock in stability for your practice year-round.",
    features: [
      "Maximum listings & unlimited specialist seats*",
      "Dedicated success checklist & export-ready reports",
      "First access to new marketplace features",
      "Annual savings vs. monthly — keep more revenue",
    ],
  },
];

function formatEtb(amount: number) {
  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `ETB ${amount.toLocaleString()}`;
  }
}

function isEligibleForSubscribe(business: Business | null) {
  if (!business) return false;
  return (
    business.status === "APPROVED" &&
    !business.is_active_subscription &&
    business.subscription_status !== "ACTIVE"
  );
}

export default function BusinessSubscribePage() {
  const router = useRouter();
  const { profile, business, loading, refreshUser } = useAuth();
  const [guarded, setGuarded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runGuards = useCallback(async () => {
    if (loading) return;
    if (!profile || profile.role !== "BUSINESS") {
      setGuarded(true);
      router.replace("/");
      return;
    }
    if (!business) {
      setGuarded(true);
      router.replace("/dashboard/business");
      return;
    }
    if (business.status === "PENDING") {
      setGuarded(true);
      router.replace("/dashboard/business");
      return;
    }
    if (business.status === "SUSPENDED" || business.status === "REJECTED") {
      setGuarded(true);
      router.replace("/dashboard/business");
      return;
    }
    if (business.is_active_subscription || business.subscription_status === "ACTIVE") {
      setGuarded(true);
      router.replace("/dashboard/business");
      return;
    }
    if (business.status !== "APPROVED") {
      setGuarded(true);
      router.replace("/dashboard/business");
    }
  }, [loading, profile, business, router]);

  useEffect(() => {
    void runGuards();
  }, [runGuards]);

  const handleSubscribe = async (plan: PlanKey) => {
    if (!business) return;
    setError(null);
    setLoadingPlan(plan);
    try {
      if (isMockMode()) {
        const { error: upErr } = await supabase
          .from("businesses")
          .update({
            subscription_status: "ACTIVE",
            is_active_subscription: true,
            subscription_plan: plan,
          })
          .eq("id", business.id);

        if (upErr) {
          const message =
            typeof upErr.message === "string"
              ? upErr.message
              : "Could not activate subscription in demo mode.";
          setError(message);
          toast({
            title: "Demo activation failed",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Subscription activated (demo)",
          description: "Redirecting to your dashboard.",
        });
        await refreshUser();
        router.replace("/dashboard/business");
        return;
      }

      const response = await fetch("/api/initiate-chapa-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: business.id, plan }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : "Could not start payment. Please try again.";
        setError(message);
        toast({
          title: "Payment could not start",
          description: message,
          variant: "destructive",
        });
        return;
      }

      const checkoutUrl = data.checkout_url as string | undefined;
      if (checkoutUrl) {
        toast({
          title: "Redirecting to secure checkout",
          description: "Complete your payment with Chapa to activate your plan.",
        });
        window.location.href = checkoutUrl;
        return;
      }

      setError("No checkout link returned. Please try again later.");
      toast({
        title: "Configuration error",
        description: "Chapa did not return a checkout URL.",
        variant: "destructive",
      });
    } catch (e) {
      console.error(e);
      const message = "Network error. Check your connection and try again.";
      setError(message);
      toast({
        title: "Something went wrong",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loading || guarded || !business || !isEligibleForSubscribe(business)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="text-sm text-muted-foreground">Checking your account…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-16">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-teal-500/5 px-6 py-10 md:px-10 md:py-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="secondary" className="gap-1 font-normal">
            <HeartPulse className="size-3.5" />
            Approved — activate your practice
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Start your plan today!
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            <span className="font-medium text-foreground">{business.name}</span> is ready to go
            live. Pick a subscription to unlock your dashboard, listings, and bookings — processed
            safely with Chapa.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
              <Stethoscope className="size-3.5 text-primary" />
              Medical-grade experience
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
              <ShieldCheck className="size-3.5 text-primary" />
              Encrypted checkout
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
              <Activity className="size-3.5 text-primary" />
              Instant activation after payment
            </span>
          </div>
        </div>
        <HeartPulse
          className="pointer-events-none absolute -right-8 -bottom-8 size-48 text-primary/10"
          aria-hidden
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Payment</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_DEFS.map((plan) => {
          const busy = loadingPlan === plan.key;
          return (
            <Card
              key={plan.key}
              className={cn(
                "relative flex flex-col border-border/80 shadow-sm transition-all",
                plan.popular &&
                  "border-primary/40 shadow-md ring-2 ring-primary/25 md:-translate-y-1"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <Badge className="gap-1 bg-primary px-3 py-1 text-primary-foreground shadow-sm">
                    <Sparkles className="size-3.5" />
                    Most popular
                  </Badge>
                </div>
              )}
              <CardHeader className={cn("space-y-2 pt-8", plan.popular && "pt-10")}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-base leading-snug">{plan.blurb}</CardDescription>
                <div className="pt-2">
                  <span className="text-foreground text-4xl font-bold tracking-tight">
                    {formatEtb(plan.amountBirr)}
                  </span>
                  <span className="text-muted-foreground ml-1 text-sm">{plan.periodLabel}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm leading-snug">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">
                  *Fair-use limits may apply per platform policy. Taxes shown at checkout if
                  applicable.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full gap-2"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={loadingPlan !== null}
                  onClick={() => void handleSubscribe(plan.key)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <Users className="size-4" />
                      Subscribe now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>Secure billing</AlertTitle>
        <AlertDescription className="leading-relaxed">
          You’ll complete payment on Chapa’s hosted page. When the payment is verified, your
          subscription is activated automatically (
          <code className="text-xs">is_active_subscription</code>
          ). You’ll return here — use{" "}
          <Button variant="link" className="h-auto p-0 text-inherit" asChild>
            <Link href="/dashboard/business">Business dashboard</Link>
          </Button>{" "}
          if you were already charged and don’t see your workspace yet; refresh or sign in again.
        </AlertDescription>
      </Alert>
    </div>
  );
}
