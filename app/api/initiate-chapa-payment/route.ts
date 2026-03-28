import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
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

    // Fetch business details
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, owner_id, email')
      .eq('id', business_id)
      .single();

    if (fetchError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

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
    const { error: subError } = await supabase
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
      email: business.email || 'support@therapymarketplace.com',
      first_name: business.name,
      last_name: 'Subscription',
      title: `${selectedPlan.displayName} Subscription - ${business.name}`,
      description: `Therapy Marketplace ${selectedPlan.displayName} Subscription`,
      callback_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chapa-callback`,
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/business`,
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
