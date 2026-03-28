'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function PendingApprovalPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/');
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Approval in Progress</CardTitle>
          <CardDescription>
            Thank you for registering your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription className="text-left">
              Your business application is now under review by our admin team. We typically respond within 24-48 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Application submitted</p>
                <p className="text-xs text-muted-foreground">Your business details are registered</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Under review</p>
                <p className="text-xs text-muted-foreground">Admin team is verifying your information</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-sm">Approval complete</p>
                <p className="text-xs text-muted-foreground">You&apos;ll be notified and can start listing services</p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg text-left">
            <p className="text-sm font-medium text-foreground mb-2">Next steps:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Check your email for updates</li>
              <li>• Once approved, sign in to access your dashboard</li>
              <li>• Add your services and specialists</li>
              <li>• Start accepting bookings</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
            <Link href="/auth/business" className="block">
              <Button variant="ghost" className="w-full">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
