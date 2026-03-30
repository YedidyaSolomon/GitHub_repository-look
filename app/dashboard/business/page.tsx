'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import PendingApprovalView from '@/components/business/pending-approval-view';
import ActiveBusinessView from '@/components/business/active-business-view';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/use-toast';

function BusinessDashboardContent() {
  const { business, loading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentToastDone = useRef(false);

  useEffect(() => {
    if (loading || !business) return;
    const needsSubscribe =
      business.status === 'APPROVED' &&
      !business.is_active_subscription &&
      business.subscription_status !== 'ACTIVE';
    if (needsSubscribe) {
      router.replace('/dashboard/business/subscribe');
    }
  }, [loading, business, router]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment !== 'complete' || paymentToastDone.current) return;
    paymentToastDone.current = true;
    void refreshUser().then(() => {
      toast({
        title: 'Welcome back',
        description:
          'If your payment succeeded, your workspace should update in a moment. If not, wait a few seconds and refresh.',
      });
      router.replace('/dashboard/business');
    });
  }, [searchParams, refreshUser, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Business Found</h2>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have a registered business yet.
        </p>
      </div>
    );
  }

  // PENDING: Show awaiting approval screen
  if (business.status === 'PENDING') {
    return <PendingApprovalView business={business} />;
  }

  // APPROVED but subscription not active: redirecting to subscribe page
  if (
    business.status === 'APPROVED' &&
    !business.is_active_subscription &&
    business.subscription_status !== 'ACTIVE'
  ) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-muted-foreground text-sm">Taking you to subscription…</p>
      </div>
    );
  }

  // Active subscription: Show full business dashboard
  if (business.is_active_subscription && business.status === 'APPROVED') {
    return <ActiveBusinessView business={business} />;
  }

  if (business.subscription_status === 'ACTIVE' && business.status === 'APPROVED') {
    return <ActiveBusinessView business={business} />;
  }

  // SUSPENDED/REJECTED status
  if (business.status === 'SUSPENDED' || business.status === 'REJECTED') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-destructive">Application Rejected</h2>
        <p className="text-muted-foreground mb-4">
          Unfortunately, your business application was not approved.
        </p>
        {(business as { rejection_reason?: string }).rejection_reason && (
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            <span className="font-semibold">Reason:</span>{' '}
            {(business as { rejection_reason?: string }).rejection_reason}
          </p>
        )}
        <button onClick={() => router.push('/')} className="text-primary hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        Loading your business information...
      </p>
    </div>
  );
}

export default function BusinessDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-96">
          <Spinner />
        </div>
      }
    >
      <BusinessDashboardContent />
    </Suspense>
  );
}
