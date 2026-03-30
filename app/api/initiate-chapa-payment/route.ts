import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'
  );
}

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return NextResponse.json(
      { error: 'Chapa is disabled in demo mode; subscribe from the app UI.' },
      { status: 501 }
    );
  }
  try {
    const body = await request.json();
    const { business_id, plan } = body;

    if (!business_id || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: business_id, plan' },
        { status: 400 }
      );
    }

    if (!process.env.CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Chapa configuration missing' },
        { status: 500 }
      );
    }

    const baseUrl = appBaseUrl();

    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, name, owner_id, status, subscription_status, is_active_subscription')
      .eq('id', business_id)
      .single();

    if (fetchError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (business.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Business must be approved before subscribing' },
        { status: 403 }
      );
    }

    if (business.is_active_subscription || business.subscription_status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Subscription is already active' },
        { status: 400 }
      );
    }

    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', business.owner_id)
      .single();

    const payerEmail =
      ownerProfile?.email?.trim() || 'support@therapymarketplace.com';
    const payerFirstName =
      (ownerProfile?.name || business.name || 'Business').trim().slice(0, 48) ||
      'Business';

    // Define plan pricing
    const planPricing: Record<string, { amount: number; displayName: string }> = {
      'MONTHLY': { amount: 4900, displayName: 'Monthly' },
      'QUARTERLY': { amount: 14700, displayName: 'Quarterly' },
      'YEARLY': { amount: 49000, displayName: 'Yearly' },
    };

    const selectedPlan = planPricing[plan];
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Generate unique transaction reference
    const tx_ref = `TXN-${business_id}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        business_id,
        tx_ref,
        plan,
        amount: selectedPlan.amount,
        status: 'pending',
        verified: false,
      })
      .select()
      .single();

    if (txError || !transaction) {
      console.error('Transaction creation error:', txError);
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    // Create subscription record
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        business_id,
        transaction_id: transaction.id,
        plan,
        status: 'pending',
      });

    if (subError) {
      console.error('Subscription creation error:', subError);
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      );
    }

    // Prepare Chapa payment payload
    const paymentPayload = {
      amount: selectedPlan.amount,
      currency: 'ETB',
      email: payerEmail,
      first_name: payerFirstName,
      last_name: 'Practice',
      title: `${selectedPlan.displayName} Subscription — ${business.name}`,
      description: `Therapy Marketplace ${selectedPlan.displayName} subscription`,
      callback_url: `${baseUrl}/api/chapa-callback`,
      return_url: `${baseUrl}/dashboard/business?payment=complete`,
      tx_ref: tx_ref,
      meta: {
        business_id,
        plan,
      },
    };

    // Call Chapa API
    const chapaResponse = await fetch(
      'https://api.chapa.co/v1/hosted/pay',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    if (!chapaResponse.ok) {
      console.error('Chapa API error:', await chapaResponse.text());
      return NextResponse.json(
        { error: 'Failed to initiate payment with Chapa' },
        { status: 500 }
      );
    }

    const chapaData = await chapaResponse.json();

    return NextResponse.json({
      checkout_url: chapaData.data?.checkout_url || null,
      tx_ref: tx_ref,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
