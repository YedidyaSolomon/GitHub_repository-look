'use client';

import { Business } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

interface PendingApprovalViewProps {
  business: Business;
}

export default function PendingApprovalView({ business }: PendingApprovalViewProps) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            Awaiting Admin Approval
          </CardTitle>
          <CardDescription>
            Your business application is under review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Thank you for registering with us! Your business application for{' '}
              <strong>{business.name}</strong> is currently being reviewed by our admin team.
              This typically takes 24-48 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">What&apos;s next?</h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">1.</span>
                <span>Our team will review your application and business details</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">2.</span>
                <span>You&apos;ll receive an email notification once your application is reviewed</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">3.</span>
                <span>If approved, you&apos;ll be guided through our subscription setup</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-600 font-bold">4.</span>
                <span>Once your subscription is active, you can manage services and specialists</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Business Information</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {business.name}
              </p>
              <p>
                <span className="text-muted-foreground">Description:</span> {business.description}
              </p>
              <p>
                <span className="text-muted-foreground">Submitted:</span>{' '}
                {new Date(business.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
