"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { submitBookingRequest } from "@/lib/bookings-client";
import { supabase, type Business, type Service, type Specialist } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  Building2,
  CalendarDays,
  Check,
  Clock,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";

type BookableBusiness = Pick<
  Business,
  "id" | "name" | "physical_address" | "description"
>;

type SlotInfo = {
  time: string;
  available: boolean;
  /** When specialist is "any", who can take this slot */
  specialistsAvailable: Specialist[];
};

function timeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return h * 60 + m;
}

function generateSlotStarts(start: string, end: string, stepMinutes: number): string[] {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  const out: string[] = [];
  for (let m = s; m + stepMinutes <= e; m += stepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return out;
}

function slotStepForService(durationMinutes: number): number {
  if (durationMinutes >= 30 && durationMinutes % 30 === 0) return durationMinutes;
  return 30;
}

function bookingStatusBlocksSlot(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return s !== "cancelled" && s !== "canceled";
}

function specialistsEligibleForService(
  service: Service | null,
  all: Specialist[],
): Specialist[] {
  if (!service) return all;
  const raw = service.specialist?.trim();
  if (!raw) return all;
  const names = raw.split(",").map((n) => n.trim()).filter(Boolean);
  const matched = all.filter((sp) => names.includes(sp.name));
  return matched.length > 0 ? matched : all;
}

export default function GuestBookingPage() {
  const [businesses, setBusinesses] = useState<BookableBusiness[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  const [businessId, setBusinessId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [specialistMode, setSpecialistMode] = useState<string>("any");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === businessId) ?? null,
    [businesses, businessId],
  );
  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );
  const filteredSpecialists = useMemo(
    () => specialistsEligibleForService(selectedService, specialists),
    [selectedService, specialists],
  );
  const selectedSpecialist = useMemo(
    () =>
      specialistMode !== "any"
        ? specialists.find((s) => s.id === specialistMode) ?? null
        : null,
    [specialistMode, specialists],
  );

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: e } = await supabase
          .from("businesses")
          .select("id, name, physical_address, description")
          .eq("status", "APPROVED")
          .eq("subscription_status", "ACTIVE")
          .order("name");
        if (e) throw e;
        setBusinesses((data ?? []) as BookableBusiness[]);
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Could not load businesses",
          description: "Try refreshing the page.",
        });
      } finally {
        setLoadingBiz(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!businessId) {
      setServices([]);
      setSpecialists([]);
      setServiceId("");
      setSpecialistMode("any");
      return;
    }
    void (async () => {
      const [svc, spec] = await Promise.all([
        supabase.from("services").select("*").eq("business_id", businessId),
        supabase.from("specialists").select("*").eq("business_id", businessId),
      ]);
      setServices((svc.data ?? []) as Service[]);
      setSpecialists((spec.data ?? []) as Specialist[]);
      setServiceId("");
      setSpecialistMode("any");
      setDate(undefined);
      setSelectedTime("");
      setSlots([]);
    })();
  }, [businessId]);

  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  const loadSlots = useCallback(async () => {
    if (!date || !dateStr || !selectedService || filteredSpecialists.length === 0) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    setSelectedTime("");
    setError(null);

    try {
      const dow = date.getDay();
      const step = slotStepForService(selectedService.duration_minutes);

      const targetSpecialists =
        selectedSpecialist != null
          ? [selectedSpecialist]
          : filteredSpecialists;

      const ids = targetSpecialists.map((s) => s.id);

      const [{ data: whRows }, { data: bookingRows }] = await Promise.all([
        supabase
          .from("specialist_work_hours")
          .select("*")
          .in("specialist_id", ids)
          .eq("day_of_week", dow),
        supabase
          .from("bookings")
          .select("specialist_id, booking_time, status")
          .eq("booking_date", dateStr)
          .in("specialist_id", ids),
      ]);

      const bookedKeys = new Set(
        (bookingRows ?? [])
          .filter((b) => bookingStatusBlocksSlot(b.status as string))
          .map((b) => `${b.specialist_id}|${b.booking_time}`),
      );

      const timeSet = new Set<string>();
      for (const row of whRows ?? []) {
        for (const t of generateSlotStarts(row.start_time, row.end_time, step)) {
          timeSet.add(t);
        }
      }

      const sortedTimes = [...timeSet].sort(
        (a, b) => timeToMinutes(a) - timeToMinutes(b),
      );

      const nextSlots: SlotInfo[] = sortedTimes.map((time) => {
        const availableList = targetSpecialists.filter((sp) => {
          const hasWh = (whRows ?? []).some(
            (w) =>
              w.specialist_id === sp.id &&
              generateSlotStarts(w.start_time, w.end_time, step).includes(time),
          );
          if (!hasWh) return false;
          if (bookedKeys.has(`${sp.id}|${time}`)) return false;
          return true;
        });
        return {
          time,
          available: availableList.length > 0,
          specialistsAvailable: availableList,
        };
      });

      setSlots(nextSlots);
    } catch (err) {
      console.error(err);
      setError("Could not load availability.");
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [date, dateStr, selectedService, selectedSpecialist, filteredSpecialists]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (!businessId || !dateStr) return;

    const channel = supabase
      .channel(`guest-book-${businessId}-${dateStr}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          void loadSlots();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, dateStr, loadSlots]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const resolveSpecialistForBooking = (): Specialist | null => {
    if (!selectedTime) return null;
    const slot = slots.find((s) => s.time === selectedTime);
    if (!slot || !slot.available) return null;
    if (selectedSpecialist) return selectedSpecialist;
    return slot.specialistsAvailable[0] ?? null;
  };

  const submitBooking = async () => {
    setError(null);
    const spec = resolveSpecialistForBooking();
    if (
      !businessId ||
      !selectedService ||
      !dateStr ||
      !selectedTime ||
      !spec ||
      !guestName.trim() ||
      !guestEmail.trim()
    ) {
      setError("Please complete all required fields and pick an open time.");
      return;
    }

    setSubmitting(true);
    try {
      await submitBookingRequest({
        business_id: businessId,
        service_id: selectedService.id,
        specialist_id: spec.id,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_phone: guestPhone.trim() || undefined,
        booking_date: dateStr,
        booking_time: selectedTime,
      });

      toast({
        title: "Booking confirmed",
        description: `You’re booked for ${selectedService.name} on ${dateStr} at ${selectedTime}.`,
      });

      setConfirmOpen(false);

      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setSelectedTime("");
      setDate(undefined);
      setServiceId("");
      setSpecialistMode("any");
      void loadSlots();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      toast({ variant: "destructive", title: "Booking failed", description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const durationLabel = selectedService
    ? `${selectedService.duration_minutes} min`
    : "—";

  if (loadingBiz) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-muted-foreground text-sm">Loading practices…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <HeartPulse className="size-8" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Guest booking
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Book a session
            </h1>
            <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
              No account needed. Choose a practice, service, and time — we’ll hold
              the slot for you and confirm by email.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="size-5" />
                Practice & service
              </CardTitle>
              <CardDescription>
                Only verified, subscribed practices are listed.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Business</Label>
                <Select
                  value={businessId || undefined}
                  onValueChange={(v) => setBusinessId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a practice" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBusiness?.physical_address && (
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    {selectedBusiness.physical_address}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Service</Label>
                <Select
                  value={serviceId || undefined}
                  onValueChange={setServiceId}
                  disabled={!businessId || services.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Specialist (optional)</Label>
                <Select
                  value={specialistMode}
                  onValueChange={setSpecialistMode}
                  disabled={!businessId || filteredSpecialists.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any available specialist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any available specialist</SelectItem>
                    {filteredSpecialists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Times shown respect each specialist’s schedule. “Any” picks the
                  first free clinician for your slot.
                </p>
              </div>

              {selectedService && (
                <Alert className="md:col-span-2 border-primary/20 bg-primary/5">
                  <Stethoscope className="size-4" />
                  <AlertTitle className="text-sm">{selectedService.name}</AlertTitle>
                  <AlertDescription className="text-xs">
                    Duration: <strong>{durationLabel}</strong> · From{" "}
                    <strong>{selectedService.price.toLocaleString()} ETB</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="size-5" />
                Date & time
              </CardTitle>
              <CardDescription>
                Past days are disabled. Unavailable slots appear faded like taken
                seats — pick an open time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal md:w-[280px]",
                        !date && "text-muted-foreground",
                      )}
                      disabled={!selectedService || filteredSpecialists.length === 0}
                    >
                      <CalendarDays className="mr-2 size-4" />
                      {date ? format(date, "PPP") : "Choose a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        setSelectedTime("");
                      }}
                      disabled={(d) => d < today}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {!selectedService && (
                  <p className="text-muted-foreground text-sm">
                    Select a service first to see the calendar.
                  </p>
                )}
                {selectedService && filteredSpecialists.length === 0 && (
                  <Alert variant="destructive" className="text-sm">
                    <AlertDescription>
                      This practice has no specialists yet — booking opens once they
                      add their team.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {date && selectedService && filteredSpecialists.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="size-4 text-primary" />
                    Available times ({slotStepForService(selectedService.duration_minutes)} min steps)
                  </div>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
                      <Spinner /> Checking live availability…
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No hours configured for this day. Try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {slots.map((slot) => {
                        const isSel = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() =>
                              slot.available && setSelectedTime(slot.time)
                            }
                            className={cn(
                              "relative rounded-lg border px-2 py-3 text-center text-sm font-medium transition-all",
                              slot.available &&
                                "border-border bg-card hover:border-primary hover:bg-primary/5",
                              !slot.available &&
                                "cursor-not-allowed border-muted bg-muted/50 opacity-50 blur-sm grayscale",
                              isSel &&
                                slot.available &&
                                "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                            )}
                          >
                            {slot.time}
                            {!slot.available && (
                              <span className="text-muted-foreground absolute inset-0 flex items-center justify-center text-[10px] font-normal">
                                Taken
                              </span>
                            )}
                            {isSel && slot.available && (
                              <Check className="mx-auto mt-1 size-3" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border/80 sticky top-24 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-5" />
                Your details
              </CardTitle>
              <CardDescription>We’ll use this for your confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="g-name">Full name *</Label>
                <Input
                  id="g-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-email">Email *</Label>
                <Input
                  id="g-email"
                  type="email"
                  inputMode="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="g-phone">Phone (optional)</Label>
                <Input
                  id="g-phone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+251 ..."
                  autoComplete="tel"
                />
              </div>

              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <Button
                  type="button"
                  className="w-full gap-2"
                  size="lg"
                  disabled={
                    submitting ||
                    !businessId ||
                    !serviceId ||
                    !dateStr ||
                    !selectedTime ||
                    !guestName.trim() ||
                    !guestEmail.trim()
                  }
                  onClick={() => setConfirmOpen(true)}
                >
                  <Sparkles className="size-4" />
                  Review & book
                </Button>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm your booking</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-foreground space-y-3 text-sm">
                        <ul className="space-y-2 rounded-lg border bg-muted/40 p-3">
                          <li className="flex gap-2">
                            <Building2 className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>
                              <strong>{selectedBusiness?.name}</strong>
                              {selectedBusiness?.physical_address
                                ? ` · ${selectedBusiness.physical_address}`
                                : ""}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <Stethoscope className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>
                              {selectedService?.name} · {durationLabel}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <CalendarDays className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>
                              {date ? format(date, "PPP") : ""} at {selectedTime}
                            </span>
                          </li>
                          <li className="flex gap-2">
                            <User className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span>
                              {resolveSpecialistForBooking()?.name ?? "Specialist TBD"}
                            </span>
                          </li>
                          <li className="flex gap-2 border-t pt-2">
                            <Mail className="mt-0.5 size-4 shrink-0 opacity-70" />
                            <span className="break-words">
                              {guestName} · {guestEmail}
                              {guestPhone ? ` · ${guestPhone}` : ""}
                            </span>
                          </li>
                        </ul>
                        <p className="text-muted-foreground text-xs">
                          By confirming, you agree to the practice’s policies. Slots
                          can fill quickly — unavailable times update live.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={submitting}>Go back</AlertDialogCancel>
                    <Button
                      onClick={() => void submitBooking()}
                      disabled={submitting}
                    >
                      {submitting ? "Booking…" : "Confirm booking"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <p className="text-muted-foreground text-center text-xs">
                Need an account later?{" "}
                <Link href="/auth/customer" className="text-primary underline">
                  Sign up as a customer
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
