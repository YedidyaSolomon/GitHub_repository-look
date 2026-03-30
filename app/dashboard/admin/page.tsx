"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Business, supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Building2, Calendar, Check, Clock, Mail, ShieldAlert, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

type OwnerInfo = { email: string; name: string | null };

type AdminBookingRow = {
  id: string;
  business_id: string;
  service_id: string;
  specialist_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  service?: { name: string } | null;
  specialist?: { name: string } | null;
  business?: { name: string } | null;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [ownersById, setOwnersById] = useState<Record<string, OwnerInfo>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingsSelected, setBookingsSelected] = useState<AdminBookingRow[]>([]);
  const [bookingsAll, setBookingsAll] = useState<AdminBookingRow[]>([]);

  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingBookingsSelected, setLoadingBookingsSelected] = useState(false);
  const [loadingBookingsAll, setLoadingBookingsAll] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const selected = useMemo(
    () => businesses.find((b) => b.id === selectedId) ?? null,
    [businesses, selectedId]
  );

  const loadOwners = useCallback(async (rows: Business[]) => {
    const ids = [...new Set(rows.map((b) => b.owner_id))];
    if (ids.length === 0) {
      setOwnersById({});
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", ids);

    if (error) {
      console.error(error);
      return;
    }
    const map: Record<string, OwnerInfo> = {};
    for (const p of data ?? []) {
      map[p.id] = { email: p.email ?? "", name: p.name ?? null };
    }
    setOwnersById(map);
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setLoadingBusinesses(true);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const list = (data ?? []) as Business[];
      setBusinesses(list);
      await loadOwners(list);
      setSelectedId((prev) => {
        if (prev && list.some((b) => b.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not load businesses",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingBusinesses(false);
    }
  }, [loadOwners]);

  const fetchBookingsForBusiness = useCallback(async (businessId: string | null) => {
    if (!businessId) {
      setBookingsSelected([]);
      return;
    }
    setLoadingBookingsSelected(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          service:service_id(name),
          specialist:specialist_id(name),
          business:business_id(name)
        `
        )
        .eq("business_id", businessId)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookingsSelected((data ?? []) as AdminBookingRow[]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not load bookings",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingBookingsSelected(false);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    setLoadingBookingsAll(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          service:service_id(name),
          specialist:specialist_id(name),
          business:business_id(name)
        `
        )
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setBookingsAll((data ?? []) as AdminBookingRow[]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Could not load all bookings",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingBookingsAll(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    void fetchBusinesses();
    void fetchAllBookings();
  }, [authLoading, profile, router, fetchBusinesses, fetchAllBookings]);

  useEffect(() => {
    if (profile?.role !== "ADMIN") return;
    void fetchBookingsForBusiness(selectedId);
  }, [selectedId, fetchBookingsForBusiness, profile?.role]);

  useEffect(() => {
    if (profile?.role !== "ADMIN") return;

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses" },
        () => {
          void fetchBusinesses();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void fetchBookingsForBusiness(selectedIdRef.current);
          void fetchAllBookings();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.role, fetchBusinesses, fetchBookingsForBusiness, fetchAllBookings]);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
      case "SUSPENDED":
        return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleApprove = async () => {
    if (!selected || selected.status !== "PENDING") return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          status: "APPROVED",
          rejection_reason: null,
        })
        .eq("id", selected.id);

      if (error) throw error;

      toast({ title: "Business approved", description: "They can now complete subscription." });
      setRejectReason("");
      await fetchBusinesses();
    } catch (err) {
      console.error(err);
      toast({
        title: "Approve failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected || selected.status !== "PENDING") return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Enter a rejection reason before rejecting.",
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          status: "SUSPENDED",
          rejection_reason: reason,
        })
        .eq("id", selected.id);

      if (error) throw error;

      toast({ title: "Business suspended", description: "The owner will see your reason on their dashboard." });
      setRejectReason("");
      await fetchBusinesses();
    } catch (err) {
      console.error(err);
      toast({
        title: "Reject failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || !profile || profile.role !== "ADMIN") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const pendingCount = businesses.filter((b) => b.status === "PENDING").length;
  const approvedCount = businesses.filter((b) => b.status === "APPROVED").length;
  const suspendedCount = businesses.filter((b) => b.status === "SUSPENDED").length;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" />
          Admin dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage business registrations, approvals, and bookings across the marketplace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{approvedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{suspendedCount}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="businesses" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="all-bookings">All bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="mt-4 space-y-4">
          {loadingBusinesses ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[420px]">
              <Card className="lg:col-span-5 flex flex-col overflow-hidden">
                <CardHeader className="shrink-0">
                  <CardTitle className="text-base">Registered businesses</CardTitle>
                  <CardDescription>Name, owner email, and status</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-280px)] p-0">
                  <ul className="divide-y divide-border">
                    {businesses.length === 0 ? (
                      <li className="p-6 text-sm text-muted-foreground text-center">No businesses yet.</li>
                    ) : (
                      businesses.map((b) => {
                        const owner = ownersById[b.owner_id];
                        const isSel = b.id === selectedId;
                        return (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(b.id)}
                              className={cn(
                                "w-full text-left px-4 py-3 transition-colors hover:bg-muted/80",
                                isSel && "bg-muted"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium truncate flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4 shrink-0 opacity-70" />
                                    {b.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    {owner?.email || "—"}
                                  </p>
                                </div>
                                <Badge className={cn("shrink-0 text-[10px]", statusBadgeClass(b.status))}>
                                  {b.status}
                                </Badge>
                              </div>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="lg:col-span-7 flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Business details</CardTitle>
                  <CardDescription>
                    Approve or suspend pending applications. Select a business to view its bookings below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground">Select a business from the list.</p>
                  ) : (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Business</p>
                          <p className="font-medium">{selected.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Owner email</p>
                          <p className="font-medium break-all">
                            {ownersById[selected.owner_id]?.email || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Owner</p>
                          <p className="font-medium flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {ownersById[selected.owner_id]?.name || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-wide">Status</p>
                          <Badge className={cn("mt-0.5", statusBadgeClass(selected.status))}>
                            {selected.status}
                          </Badge>
                        </div>
                        {selected.physical_address ? (
                          <div className="sm:col-span-2">
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">Address</p>
                            <p>{selected.physical_address}</p>
                          </div>
                        ) : null}
                        {selected.tin ? (
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wide">TIN</p>
                            <p>{selected.tin}</p>
                          </div>
                        ) : null}
                        {selected.rejection_reason ? (
                          <div className="sm:col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                            <p className="text-xs font-medium text-destructive">Suspension reason</p>
                            <p className="text-sm mt-1">{selected.rejection_reason}</p>
                          </div>
                        ) : null}
                      </div>

                      {selected.status === "PENDING" && (
                        <div className="space-y-3 rounded-lg border bg-card p-4">
                          <p className="text-sm font-medium">Review application</p>
                          <Textarea
                            placeholder="Rejection reason (required only if you reject)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[88px] resize-y"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => void handleApprove()}
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => void handleReject()}
                              disabled={actionLoading}
                            >
                              {actionLoading ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {selected.status === "APPROVED" && (
                        <p className="text-sm text-muted-foreground">
                          This business is approved and may subscribe to activate listings and bookings.
                        </p>
                      )}

                      <div className="flex-1 flex flex-col min-h-0 border-t pt-4">
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Bookings for this business
                        </h3>
                        {loadingBookingsSelected ? (
                          <div className="flex justify-center py-8">
                            <Spinner />
                          </div>
                        ) : bookingsSelected.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">No bookings for this business.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                                  <TableHead className="whitespace-nowrap hidden md:table-cell">Service</TableHead>
                                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Specialist</TableHead>
                                  <TableHead className="whitespace-nowrap">When</TableHead>
                                  <TableHead className="whitespace-nowrap">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bookingsSelected.map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell>
                                      <div className="font-medium text-sm">{row.customer_name}</div>
                                      <div className="text-xs text-muted-foreground">{row.customer_email}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm">
                                      {row.service?.name ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm">
                                      {row.specialist?.name ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-sm whitespace-nowrap">
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3 opacity-60" />
                                        {row.booking_date} {row.booking_time}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {row.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-bookings" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">All bookings</CardTitle>
                <CardDescription>Every appointment across all businesses</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchAllBookings()}
                disabled={loadingBookingsAll}
              >
                {loadingBookingsAll ? <Spinner className="h-4 w-4" /> : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              {loadingBookingsAll && bookingsAll.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Spinner />
                </div>
              ) : bookingsAll.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead className="hidden lg:table-cell">Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Service</TableHead>
                        <TableHead className="hidden sm:table-cell">Specialist</TableHead>
                        <TableHead>When</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookingsAll.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium text-sm">{row.business?.name ?? "—"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm">
                            <div>{row.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{row.customer_email}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {row.service?.name ?? "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {row.specialist?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {row.booking_date} {row.booking_time}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
