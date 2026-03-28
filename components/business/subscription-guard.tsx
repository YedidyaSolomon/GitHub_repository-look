'use client';

import { Business } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionGuardProps {
  business: Business;
  children: React.ReactNode;
}

export default function SubscriptionGuard({ business, children }: SubscriptionGuardProps) {
  const router = useRouter();

  // If subscription is active, show children normally
  if (business.subscription_status === 'ACTIVE') {
    return <>{children}</>;
  }

  // If subscription is not active, show warning
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">Subscription Required</p>
            <p>
              Your subscription is not active. Management features are limited.
              {business.subscription_status === 'APPROVED' && 
                ' Please complete the subscription setup to access all features.'}
            </p>
            {business.subscription_status === 'APPROVED' && (
              <Button
                size="sm"
                onClick={() => router.refresh()}
                className="mt-2"
              >
                Complete Subscription
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Show limited view */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
}
