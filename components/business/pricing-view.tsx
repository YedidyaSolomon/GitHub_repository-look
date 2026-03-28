'use client';

import { useState } from 'react';
import { Business } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check } from 'lucide-react';

interface PricingViewProps {
  business: Business;
}

export default function PricingView({ business }: PricingViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitiatePayment = async (plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/initiate-chapa-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          plan: plan,
        }),
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError('Error initiating payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Monthly',
      value: 'MONTHLY' as const,
      price: '₦49',
      period: '/month',
      features: [
        'List up to 5 services',
        'Manage up to 10 specialists',
        'Customer bookings & messaging',
        'Basic analytics',
      ],
    },
    {
      name: 'Quarterly',
      value: 'QUARTERLY' as const,
      price: '₦147',
      period: '/3 months',
      features: [
        'List up to 15 services',
        'Manage up to 25 specialists',
        'Customer bookings & messaging',
        'Standard analytics',
        'Save 1% vs monthly',
      ],
    },
    {
      name: 'Yearly',
      value: 'YEARLY' as const,
      price: '₦490',
      period: '/year',
      features: [
        'List unlimited services',
        'Manage unlimited specialists',
        'Advanced analytics',
        'Priority support',
        'Save 17% vs monthly',
      ],
      popular: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">Select Your Subscription Plan</h2>
        <p className="text-muted-foreground text-balance">
          Your application for {business.name} has been approved! Choose a subscription plan to activate your business.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card
            key={plan.value}
            className={`relative transition-all ${
              selectedPlan === plan.value ? 'ring-2 ring-primary' : ''
            } ${plan.popular ? 'border-primary md:scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleInitiatePayment(plan.value)}
                disabled={loading}
                variant={selectedPlan === plan.value ? 'default' : 'outline'}
                className="w-full"
              >
                {loading && selectedPlan === plan.value ? 'Processing...' : 'Choose Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <AlertDescription>
          Payments are processed securely through Chapa. After payment confirmation, your subscription will be activated and you can immediately start managing your services and specialists.
        </AlertDescription>
      </Alert>
    </div>
  );
}
