'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import PendingApprovalView from '@/components/business/pending-approval-view';
import PricingView from '@/components/business/pricing-view';
import ActiveBusinessView from '@/components/business/active-business-view';
import { Spinner } from '@/components/ui/spinner';

export default function BusinessDashboard() {
  const { business, loading } = useAuth();
  const router = useRouter();

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

  // APPROVED but subscription not active: Show pricing page
  if (business.status === 'APPROVED' && !(business as any).is_active_subscription) {
    return <PricingView business={business} />;
  }

  // Active subscription: Show full business dashboard
  if ((business as any).is_active_subscription && business.status === 'APPROVED') {
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
        {(business as any).rejection_reason && (
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            <span className="font-semibold">Reason:</span> {(business as any).rejection_reason}
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
