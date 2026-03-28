import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      service_id,
      specialist_id,
      business_id,
      customer_name,
      customer_email,
      customer_phone,
      guest_name,
      guest_email,
      guest_phone,
      booking_date,
      booking_time,
      booked_by,
    } = body;

    const finalCustomerName = customer_name || guest_name;
    const finalCustomerEmail = customer_email || guest_email;
    const finalCustomerPhone = customer_phone || guest_phone || '';

    // Validate required fields
    if (
      !service_id ||
      !specialist_id ||
      !business_id ||
      !finalCustomerName ||
      !finalCustomerEmail ||
      !booking_date ||
      !booking_time
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if business has active subscription
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('subscription_status')
      .eq('id', business_id)
      .single();

    if (businessError || !businessData || businessData.subscription_status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Business subscription is not active' },
        { status: 403 }
      );
    }

    // Check for double-booking (conflict detection)
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('specialist_id', specialist_id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .eq('status', 'confirmed')
      .single();

    if (!checkError && existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please select another time.' },
        { status: 409 }
      );
    }

    // Create booking
    // Map the guest names as requested but also guarantee customer_name/email/phone for strict SETUP_GUIDE schema alignment
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        service_id,
        specialist_id,
        business_id,
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: finalCustomerPhone,
        guest_name: guest_name || null,
        guest_email: guest_email || null,
        guest_phone: guest_phone || null,
        booking_date,
        booking_time,
        booked_by: booked_by || null,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialistId = searchParams.get('specialist_id');
    const bookingDate = searchParams.get('date');

    let query = supabase.from('bookings').select('*');

    if (specialistId) {
      query = query.eq('specialist_id', specialistId);
    }

    if (bookingDate) {
      query = query.eq('booking_date', bookingDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
