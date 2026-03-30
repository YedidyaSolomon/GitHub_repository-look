"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { submitBookingRequest } from "@/lib/bookings-client";
import { supabase, type Business, type Service, type Specialist } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Building2, CalendarDays, Check, Clock, HeartPulse, Mail, MapPin, Phone, Sparkles, Star, Stethoscope, User, Users } from "lucide-react";

type SlotInfo = {
  time: string;
  available: boolean;
  specialistsAvailable: Specialist[];
};

function timeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
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
  return durationMinutes >= 30 && durationMinutes % 30 === 0 ? durationMinutes : 30;
}

function bookingStatusBlocksSlot(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return s !== "cancelled" && s !== "canceled";
}

function specialistsEligibleForService(service: Service | null, all: Specialist[]): Specialist[] {
  if (!service) return all;
  const raw = service.specialist?.trim();
  if (!raw) return all;
  const names = raw.split(",").map((n) => n.trim()).filter(Boolean);
  const matched = all.filter((sp) => names.includes(sp.name));
  return matched.length > 0 ? matched : all;
}

export default function BusinessProfilePage() {
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state (like guest-booking)
  const [serviceId, setServiceId] = useState<string>("");
  const [specialistMode, setSpecialistMode] = useState<string>("any");
  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId) ?? null, [services, serviceId]);
  const filteredSpecialists = useMemo(() => specialistsEligibleForService(selectedService, specialists), [selectedService, specialists]);
  const selectedSpecialist = useMemo(() => specialistMode !== "any" ? specialists.find((s) => s.id === specialistMode) ?? null : null, [specialistMode, specialists]);
  const dateStr = date ? format(date, "yyyy-MM-dd") : "";

  useEffect(() => {
    async function fetchBusinessData() {
      if (!businessId) return;
      setLoading(true);
      try {
        const [{ data: bizData }, { data: svcData }, { data: specData }] = await Promise.all([
          supabase.from("businesses").select("*").eq("id", businessId).single(),
          supabase.from("services").select("*").eq("business_id", businessId),
          supabase.from("specialists").select("*").eq("business_id", businessId),
        ]);
        setBusiness(bizData as Business | null);
        setServices(svcData as Service[] || []);
        setSpecialists(specData as Specialist[] || []);
      } catch (err) {
        console.error("Failed to fetch business:", err);
        toast({ variant: "destructive", title: "Error loading business profile" });
      } finally {
        setLoading(false);
      }
    }
    fetchBusinessData();
  }, [businessId]);

  const loadSlots = useCallback(async () => {
    if (!date || !dateStr || !selectedService || filteredSpecialists.length === 0) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    try {
      const dow = date.getDay();
      const step = slotStepForService(selectedService.duration_minutes);
      const targetSpecialists = selectedSpecialist ? [selectedSpecialist] : filteredSpecialists;
      const ids = targetSpecialists.map((s) => s.id);
      const [{ data: whRows }, { data: bookingRows }] = await Promise.all([
        supabase.from("specialist_work_hours").select("*").in("specialist_id", ids).eq("day_of_week", dow),
        supabase.from("bookings").select("specialist_id, booking_time, status").eq("booking_date", dateStr).in("specialist_id", ids),
      ]);
      const bookedKeys = new Set(bookingRows?.filter((b: any) => bookingStatusBlocksSlot(b.status)).map((b: any) => `${b.specialist_id}|${b.booking_time}`) || []);
      const timeSet = new Set<string>();
      for (const row of (whRows || [])) {
        for (const t of generateSlotStarts(row.start_time, row.end_time, step)) {
          timeSet.add(t);
        }
      }
      const sortedTimes = [...timeSet].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      const nextSlots: SlotInfo[] = sortedTimes.map((time) => {
        const availableList = targetSpecialists.filter((sp) => {
          const hasWh = (whRows || []).some((w: any) => w.specialist_id === sp.id && generateSlotStarts(w.start_time, w.end_time, step).includes(time));
          return hasWh && !bookedKeys.has(`${sp.id}|${time}`);
        });
        return { time, available: availableList.length > 0, specialistsAvailable: availableList };
      });
      setSlots(nextSlots);
    } catch (err) {
      setError("Could not load availability");
    } finally {
      setSlotsLoading(false);
    }
  }, [date, dateStr, selectedService, selectedSpecialist, filteredSpecialists]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const submitBooking = async () => {
    const spec = slots.find(s => s.time === selectedTime)?.specialistsAvailable[0] ?? selectedSpecialist ?? null;
    if (!selectedService || !dateStr || !selectedTime || !spec || !guestName.trim() || !guestEmail.trim()) {
      setError("Complete all fields");
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
      toast({ title: "Booking confirmed!" });
      // Reset form
      setServiceId("");
      setSpecialistMode("any");
      setDate(undefined);
      setSelectedTime("");
      setGuestName("");
      setGuestEmail("");
      setGuestPhone("");
      setConfirmOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const resolveSpecialistForBooking = () => {
    if (!selectedTime) return null;
    const slot = slots.find((s) => s.time === selectedTime);
    if (!slot || !slot.available) return null;
    return selectedSpecialist ?? slot.specialistsAvailable[0] ?? null;
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  }

  if (!business) {
    return <div className="container mx-auto px-4 py-20 text-center">Business not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-primary to-[var(--gold)] text-primary-foreground py-32 -mb-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
                {business.name}
              </h1>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current text-yellow-400" />
                  ))}
                </div>
                <span className="text-xl font-semibold">(4.8)</span>
              </div>
              <p className="text-xl opacity-90 leading-relaxed mb-8 max-w-md">
                {business.description}
              </p>
              {business.physical_address && (
                <div className="flex items-center gap-2 text-lg mb-4">
                  <MapPin className="w-5 h-5" />
                  {business.physical_address}
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5" />
                  <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a>
                </div>
              )}
            </div>
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-75" />
                  <div className="text-3xl font-bold">{specialists.length}</div>
                  <div className="text-lg opacity-90">Specialists</div>
                </CardContent>
              </Card>
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="p-8 text-center">
                  <HeartPulse className="w-16 h-16 mx-auto mb-4 opacity-75" />
                  <div className="text-3xl font-bold">{services.length}</div>
                  <div className="text-lg opacity-90">Services</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-16 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="specialists">Specialists</TabsTrigger>
                <TabsTrigger value="book">Book Now</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6 pt-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-2xl font-bold mb-4">About {business.name}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {business.description || "Providing premium therapy and wellness services."}
                    </p>
                  </CardContent>
                </Card>
                {/* Services preview */}
                {services.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Popular Services</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      {services.slice(0, 4).map((service) => (
                        <div key={service.id} className="border rounded-lg p-6 hover:shadow-md transition">
                          <h4 className="font-semibold mb-2">{service.name}</h4>
                          <p className="text-muted-foreground mb-4">{service.description?.slice(0, 100)}...</p>
                          <div className="flex justify-between items-center">
                            <Badge>₦{service.price?.toLocaleString()}</Badge>
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="services" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Services ({services.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.map((service) => (
                        <Card key={service.id} className="hover:shadow-lg">
                          <CardContent className="p-6">
                            <h4 className="font-bold text-lg mb-2">{service.name}</h4>
                            <p className="text-muted-foreground mb-4 line-clamp-3">{service.description}</p>
                            <div className="flex justify-between items-center text-2xl font-bold">
                              <span>₦{service.price?.toLocaleString()}</span>
                              <div className="flex gap-2">
                                <span className="text-sm font-normal text-muted-foreground">{service.duration_minutes} min</span>
                                <Button size="sm" onClick={() => { setServiceId(service.id); setSpecialistMode("any"); }}>Book</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="specialists" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Our Specialists ({specialists.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {specialists.map((spec) => (
                        <Card key={spec.id} className="hover:shadow-lg">
                          <CardContent className="p-6 text-center">
                            <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                              <Users className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">{spec.name}</h4>
                            <p className="text-muted-foreground mb-4">{spec.qualifications}</p>
                            <Badge>{spec.availability ? "Available" : "Busy"}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="book" className="pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      Book Appointment - Guest Checkout
                    </CardTitle>
                    <CardDescription>No account needed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Service</Label>
                          <Select value={serviceId} onValueChange={setServiceId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose service" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Specialist</Label>
                          <Select value={specialistMode} onValueChange={setSpecialistMode} disabled={!serviceId || filteredSpecialists.length === 0}>
                            <SelectTrigger>
                              <SelectValue placeholder="Any available" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any specialist</SelectItem>
                              {filteredSpecialists.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" disabled={!serviceId || filteredSpecialists.length === 0} className="w-full justify-start">
                              <CalendarDays className="mr-2 h-4 w-4" /> {date ? format(date, "PPP") : "Pick date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < today} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-4">
                        {date && selectedService && (
                          <>
                            {slotsLoading ? (
                              <div className="flex items-center gap-2 py-8"><Spinner className="h-4 w-4" /> Loading slots...</div>
                            ) : slots.length === 0 ? (
                              <p>No availability for this date</p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {slots.map((slot) => (
                                  <Button
                                    key={slot.time}
                                    variant={selectedTime === slot.time ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => slot.available ? setSelectedTime(slot.time) : null}
                                    disabled={!slot.available}
                                    className={cn(!slot.available && "opacity-50")}
                                  >
                                    {slot.time}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label>Full Name *</Label>
                        <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" />
                      </div>
                      <div>
                        <Label>Phone (optional)</Label>
                        <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+234 ..." />
                      </div>
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="email@example.com" />
                    </div>
                    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full" size="lg" disabled={submitting || !selectedTime || !guestName || !guestEmail}>
                          Book Now - Free
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            {selectedService?.name} with {resolveSpecialistForBooking()?.name || "any specialist"} on {dateStr} at {selectedTime}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button onClick={submitBooking} disabled={submitting}>
                            {submitting ? "Confirming..." : "Confirm & Book"}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="ghost">
                  <Link href="/book">
                    <HeartPulse className="mr-2 h-4 w-4" />
                    Browse All Providers
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="ghost">
                  <Link href="/">
                    <Building2 className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                <p>Verified Business · Real-time Availability · Secure Booking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

