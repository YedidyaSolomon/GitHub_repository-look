"use client";

import { isMockMode } from "./mock/flags";
import { supabase } from "./supabase";

export type ClientBookingPayload = {
  business_id: string;
  service_id: string;
  specialist_id: string;
  booking_date: string;
  booking_time: string;
  booked_by?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
};

/**
 * Guest and logged-in booking submit. In mock mode uses the in-memory Supabase client
 * (no `/api/bookings`). Otherwise POSTs to the API (real DB + server checks).
 */
export async function submitBookingRequest(body: ClientBookingPayload) {
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
  const finalCustomerPhone = customer_phone || guest_phone || "";

  if (
    !service_id ||
    !specialist_id ||
    !business_id ||
    !finalCustomerName ||
    !finalCustomerEmail ||
    !booking_date ||
    !booking_time
  ) {
    throw new Error("Missing required fields");
  }

  if (isMockMode()) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        service_id,
        specialist_id,
        business_id,
        customer_name: finalCustomerName,
        customer_email: finalCustomerEmail,
        customer_phone: finalCustomerPhone,
        guest_name: guest_name ?? null,
        guest_email: guest_email ?? null,
        guest_phone: guest_phone ?? null,
        booking_date,
        booking_time,
        booked_by: booked_by ?? null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      throw new Error(
        typeof error.message === "string" ? error.message : "Failed to create booking",
      );
    }
    return data;
  }

  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Booking failed");
  }
  return data;
}
