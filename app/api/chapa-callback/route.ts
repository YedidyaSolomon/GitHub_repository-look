import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return NextResponse.json(
      { error: 'Chapa callback disabled in demo mode.' },
      { status: 501 }
    );
  }
  try {
    const body = await request.json();
    const { tx_ref } = body;

    if (!tx_ref) {
      return NextResponse.json(
        { error: 'Missing transaction reference' },
        { status: 400 }
      );
    }

    if (!process.env.CHAPA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Chapa configuration missing' },
        { status: 500 }
      );
    }

    // Verify payment with Chapa
    const verifyResponse = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error('Chapa verification failed:', await verifyResponse.text());
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const verifyData = await verifyResponse.json();
    const chapaStatus = verifyData.data?.status;
    const businessId = verifyData.data?.meta?.business_id;
    const plan = verifyData.data?.meta?.plan;

    if (chapaStatus !== 'success') {
      // Update transaction status to failed
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed', verified: false })
        .eq('tx_ref', tx_ref);

      return NextResponse.json(
        { error: 'Payment was not successful' },
        { status: 400 }
      );
    }

    if (!businessId || !plan) {
      console.error('Missing metadata in Chapa response');
      return NextResponse.json(
        { error: 'Invalid payment metadata' },
        { status: 400 }
      );
    }

    // Update transaction record
    const { error: txUpdateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'success',
        verified: true,
      })
      .eq('tx_ref', tx_ref);

    if (txUpdateError) {
      console.error('Transaction update error:', txUpdateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Calculate subscription end date based on plan
    const now = new Date();
    let endDate = new Date(now);

    switch (plan) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'YEARLY':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Update subscription record
    const { error: subUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
      })
      .eq('business_id', businessId)
      .eq('plan', plan)
      .eq('status', 'pending');

    if (subUpdateError) {
      console.error('Subscription update error:', subUpdateError);
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      );
    }

    // Update business subscription status and activate subscription
    const { error: businessUpdateError } = await supabaseAdmin
      .from('businesses')
      .update({
        subscription_status: 'ACTIVE',
        subscription_plan: plan,
        subscription_start_date: now.toISOString(),
        is_active_subscription: true, // CRITICAL: Unlock business features immediately
      })
      .eq('id', businessId);

    if (businessUpdateError) {
      console.error('Business update error:', businessUpdateError);
      return NextResponse.json(
        { error: 'Failed to update business subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Payment verified and subscription activated',
        business_id: businessId,
        redirect_url: '/dashboard/business',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
