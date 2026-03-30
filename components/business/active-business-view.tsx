"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import { Business, supabase, Service, Specialist } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import ServicesTab from "./services-tab";
import SpecialistsTab from "./specialists-tab";
import BookingsTab from "./bookings-tab";
import BusinessProfileTab from "./business-profile-tab";
import { cn } from "@/lib/utils";

interface ActiveBusinessViewProps {
  business: Business;
}

type Section = "overview" | "services" | "bookings" | "profile";

export default function ActiveBusinessView({ business }: ActiveBusinessViewProps) {
  const [biz, setBiz] = useState(business);
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("overview");

  useEffect(() => {
    setBiz(business);
  }, [business]);

  const isActive =
    Boolean(business.is_active_subscription) ||
    business.subscription_status === "ACTIVE";

  useEffect(() => {
    if (!isActive) return;

    const load = async () => {
      try {
        const [svc, spec, bookingsRes] = await Promise.all([
          supabase.from("services").select("*").eq("business_id", biz.id),
          supabase.from("specialists").select("*").eq("business_id", biz.id),
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("business_id", biz.id),
        ]);

        if (svc.data) setServices(svc.data);
        if (spec.data) setSpecialists(spec.data);
        setBookingCount(bookingsRes.count ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [biz.id, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const channel = supabase
      .channel(`business-dashboard-${biz.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "services",
          filter: `business_id=eq.${biz.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("services")
            .select("*")
            .eq("business_id", biz.id);
          if (data) setServices(data);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "specialists",
          filter: `business_id=eq.${biz.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("specialists")
            .select("*")
            .eq("business_id", biz.id);
          if (data) setSpecialists(data);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${biz.id}`,
        },
        async () => {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("business_id", biz.id);
          setBookingCount(count ?? 0);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [biz.id, isActive]);

  const overviewStats = useMemo(
    () => [
      {
        label: "Services listed",
        value: services.length,
        icon: Stethoscope,
      },
      {
        label: "Bookings (total)",
        value: bookingCount ?? "—",
        icon: CalendarCheck,
      },
      {
        label: "Team members",
        value: specialists.length,
        icon: ShieldCheck,
      },
    ],
    [services.length, bookingCount, specialists.length],
  );

  if (!isActive) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Subscription required</CardTitle>
          <CardDescription>
            Your business dashboard unlocks after an active subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default">
            <a href="/dashboard/business/subscribe">View plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const navItem = (id: Section, label: string, icon: ElementType<{ className?: string }>) => {
    const Icon = icon;
    const isSel = section === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setSection(id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
          isSel
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="size-4 shrink-0 opacity-90" />
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="shrink-0 lg:w-56 lg:sticky lg:top-24">
        <div className="rounded-xl border bg-card/80 p-2 shadow-sm backdrop-blur-sm max-lg:hidden">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItem("overview", "Overview", LayoutDashboard)}
            {navItem("services", "Services", Stethoscope)}
            {navItem("bookings", "Bookings", CalendarCheck)}
            {navItem("profile", "Profile", Sparkles)}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <Tabs
          value={section}
          onValueChange={(v) => setSection(v as Section)}
          className="lg:hidden"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm">
              Services
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              Profile
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-primary/5 via-background to-teal-500/5 shadow-sm">
          <CardHeader className="pb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Active</Badge>
              {biz.subscription_plan && (
                <Badge variant="outline" className="capitalize">
                  {biz.subscription_plan.toLowerCase()} plan
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {biz.name}
            </CardTitle>
            {biz.description ? (
              <CardDescription className="mt-2 max-w-2xl text-base leading-relaxed">
                {biz.description}
              </CardDescription>
            ) : (
              <CardDescription className="mt-2">
                Manage services, bookings, and your public profile from one place.
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {section === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid gap-4 sm:grid-cols-3">
              {overviewStats.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="border-border/80 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {label}
                    </CardTitle>
                    <Icon className="size-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-semibold tabular-nums">{value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Practice snapshot</CardTitle>
                <CardDescription>Shown on your public listing.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {biz.physical_address && (
                  <div className="flex gap-2 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{biz.physical_address}</span>
                  </div>
                )}
                <div className="flex gap-2 text-sm sm:col-span-2">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>Email & phone — update in the Profile tab.</span>
                </div>
                <div className="flex gap-2 text-sm sm:col-span-2">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>Keep contact details current so clients can reach you.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {section === "services" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <ServicesTab
              businessId={biz.id}
              services={services}
              setServices={setServices}
            />
            <Separator />
            <div>
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                Team & specialists
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add practitioners here, then assign them to each service.
              </p>
              <SpecialistsTab
                businessId={biz.id}
                specialists={specialists}
                setSpecialists={setSpecialists}
              />
            </div>
          </div>
        )}

        {section === "bookings" && (
          <div className="animate-in fade-in duration-200">
            <BookingsTab businessId={biz.id} />
          </div>
        )}

        {section === "profile" && (
          <div className="animate-in fade-in duration-200">
            <BusinessProfileTab
              business={biz}
              onBusinessUpdate={(patch) =>
                setBiz((prev) => ({ ...prev, ...patch }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
