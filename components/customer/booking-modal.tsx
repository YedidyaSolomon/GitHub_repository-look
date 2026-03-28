'use client';

import { useState, useEffect } from 'react';
import { supabase, Service, Specialist } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { Calendar, Clock } from 'lucide-react';

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  specialist: Specialist;
  businessId: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookingModal({
  open,
  onOpenChange,
  service,
  specialist,
  businessId,
}: BookingModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  const [formData, setFormData] = useState({
    customer_name: profile?.full_name || '',
    customer_email: profile?.email || '',
    customer_phone: '',
    booking_date: '',
    booking_time: '',
  });

  // Fetch available time slots for selected date
  const fetchAvailableSlots = async (date: string) => {
    if (!date) return;
    
    setFetchingSlots(true);
    try {
      // Get work hours for specialist
      const { data: workHours } = await supabase
        .from('specialist_work_hours')
        .select('*')
        .eq('specialist_id', specialist.id)
        .eq('day_of_week', new Date(date).getDay());

      if (!workHours || workHours.length === 0) {
        setAvailableSlots([]);
        setFetchingSlots(false);
        return;
      }

      // Get existing bookings for this specialist on this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('specialist_id', specialist.id)
        .eq('booking_date', date);

      const bookedTimes = (bookings || []).map(b => b.booking_time);

      // Generate time slots (30-minute intervals during work hours)
      const slots: TimeSlot[] = [];
      const startHour = parseInt(workHours[0].start_time.split(':')[0]);
      const endHour = parseInt(workHours[0].end_time.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          slots.push({
            time: timeStr,
            available: !bookedTimes.includes(timeStr),
          });
        }
      }

      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to fetch available time slots');
    } finally {
      setFetchingSlots(false);
    }
  };

  // When date changes, fetch available slots
  useEffect(() => {
    if (formData.booking_date) {
      fetchAvailableSlots(formData.booking_date);
    }
  }, [formData.booking_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.customer_name || !formData.customer_email || !formData.booking_date || !formData.booking_time) {
        throw new Error('Please fill in all required fields');
      }

      // Create booking payload
      const bookingData: any = {
        service_id: service.id,
        specialist_id: specialist.id,
        business_id: businessId,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
      };

      if (profile?.id) {
        bookingData.booked_by = profile.id; // API expects booked_by mapping
        bookingData.customer_name = formData.customer_name;
        bookingData.customer_email = formData.customer_email;
        bookingData.customer_phone = formData.customer_phone;
      } else {
        bookingData.guest_name = formData.customer_name;
        bookingData.guest_email = formData.customer_email;
        bookingData.guest_phone = formData.customer_phone;
      }

      // Delegate double-booking validation and insert to the server API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create booking.');
      }

      alert('Booking created successfully! Check your email for confirmation.');
      onOpenChange(false);
      setFormData({
        customer_name: profile?.full_name || '',
        customer_email: profile?.email || '',
        customer_phone: '',
        booking_date: '',
        booking_time: '',
      });
      setAvailableSlots([]);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Service</DialogTitle>
          <DialogDescription>
            {service.name} with {specialist.name}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Info */}
          <Alert>
            <AlertDescription>
              <p className="font-semibold mb-1">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                Duration: {service.duration_minutes} mins | Price: ₦{service.price.toFixed(2)}
              </p>
            </AlertDescription>
          </Alert>

          {/* User Status Badge */}
          {profile?.id && (
            <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
              <p className="text-sm text-green-800">
                Booking as <span className="font-semibold">{profile.full_name}</span>
              </p>
            </div>
          )}

          {/* Guest Fields - Only show if not authenticated */}
          {!profile?.id && (
            <>
              {/* Name */}
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Date */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Booking Date
            </label>
            <Input
              type="date"
              value={formData.booking_date}
              onChange={(e) => setFormData({ ...formData, booking_date: e.target.value, booking_time: '' })}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time Slots */}
          {formData.booking_date && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Available Times
              </label>
              {fetchingSlots ? (
                <div className="text-sm text-muted-foreground">Loading available times...</div>
              ) : availableSlots.length > 0 ? (
                <Select value={formData.booking_time} onValueChange={(value) => setFormData({ ...formData, booking_time: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot.time} value={slot.time} disabled={!slot.available}>
                        {slot.time} {!slot.available && '(Booked)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">No available times for this date</div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || !formData.booking_time}>
            {loading ? 'Creating Booking...' : 'Confirm Booking'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
