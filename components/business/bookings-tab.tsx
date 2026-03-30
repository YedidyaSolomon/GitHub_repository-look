'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Phone, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface Booking {
  id: string;
  service_id: string;
  specialist_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  created_at: string;
  service?: { name: string; price: number };
  specialist?: { name: string };
}

function normalizeStatus(raw: string): BookingStatus {
  const s = raw.toLowerCase().replace(/\s/g, '');
  if (s === 'completed') return 'completed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'pending') return 'pending';
  if (s === 'confirmed' || s === 'confirm') return 'confirmed';
  return 'confirmed';
}

interface BookingsTabProps {
  businessId: string;
}

export default function BookingsTab({ businessId }: BookingsTabProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:service_id(name, price),
          specialist:specialist_id(name)
        `)
        .eq('business_id', businessId)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      const normalized = (data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        status: normalizeStatus(String(row.status ?? 'confirmed')),
      })) as Booking[];
      setBookings(normalized);
      setFilteredBookings(normalized);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast({
        variant: 'destructive',
        title: 'Could not load bookings',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const channel = supabase
      .channel(`bookings-tab-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          void fetchBookings();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [businessId, fetchBookings]);

  useEffect(() => {
    let filtered = bookings;
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (b) =>
          b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.customer_email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }
    setFilteredBookings(filtered);
  }, [searchQuery, statusFilter, bookings]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)),
      );
      toast({ title: 'Booking cancelled', description: 'The slot is released.' });
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast({
        variant: 'destructive',
        title: 'Cancel failed',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'completed' } : b)),
      );
      toast({ title: 'Marked complete', description: 'Session saved.' });
    } catch (err) {
      console.error('Error completing booking:', err);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Try again.',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100';
      case 'completed':
        return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100';
      case 'cancelled':
        return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner />
          <p className="text-muted-foreground text-sm">Loading bookings…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="space-y-4">
        <CardTitle className="text-xl font-semibold">Bookings</CardTitle>
        <p className="text-muted-foreground text-sm">
          Updates automatically when customers book or statuses change.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-right text-sm">
          {filteredBookings.length} shown
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No bookings match your filters.
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="border-border/80 shadow-sm">
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-semibold">{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="break-all text-muted-foreground">{booking.customer_email}</span>
                    </div>
                    {booking.customer_phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">{booking.customer_phone}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {booking.booking_date}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {booking.booking_time}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{booking.service?.name ?? '—'}</p>
                      <p className="text-muted-foreground text-sm">
                        Specialist: {booking.specialist?.name ?? '—'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge className={getStatusColor(booking.status)} variant="secondary">
                        {booking.status}
                      </Badge>
                      {booking.service?.price != null ? (
                        <span className="font-medium text-sm">
                          {booking.service.price.toLocaleString()} ETB
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCompleteBooking(booking.id)}
                    >
                      Mark complete
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Cancel booking
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The appointment will be marked cancelled and the slot freed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Back</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleCancelBooking(booking.id)}>
                            Yes, cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
