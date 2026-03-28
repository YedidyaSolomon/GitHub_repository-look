'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      switch (profile.role) {
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'BUSINESS':
          router.push('/dashboard/business');
          break;
        case 'CUSTOMER':
          router.push('/dashboard/customer');
          break;
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              🕊️
            </div>
            <h1 className="font-bold text-xl text-foreground">TherapyHub</h1>
          </div>
        </div>
      </nav>

      {/* Hero Section - Split Design */}
      <section className="min-h-[calc(100vh-72px)] flex items-center">
        <div className="container mx-auto px-4 py-16 md:py-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-stretch">
            {/* Customer Path */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-8 md:p-12 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                    Find a Therapist
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 text-balance">
                    Discover qualified therapy professionals. Browse specialties, check availability, and book sessions that fit your schedule.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Search by specialty &amp; location
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Real-time availability
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Secure booking &amp; payments
                    </li>
                  </ul>
                </div>
                <Link href="/auth/customer" className="inline-block">
                  <Button size="lg" className="w-full md:w-auto gap-2 bg-primary hover:bg-primary/90">
                    Find a Therapist
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Business Path */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
              <div className="relative p-8 md:p-12 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
                    <Stethoscope className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                    List Your Business
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 text-balance">
                    Grow your therapy practice. Manage appointments, specialists, and reach new clients through our verified marketplace.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-secondary-foreground" />
                      Easy service management
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-secondary-foreground" />
                      Team coordination tools
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-secondary-foreground" />
                      Verified by admin approval
                    </li>
                  </ul>
                </div>
                <Link href="/auth/business" className="inline-block">
                  <Button size="lg" variant="outline" className="w-full md:w-auto gap-2 border-secondary-foreground text-secondary-foreground hover:bg-secondary/10">
                    List Your Business
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            TherapyHub © 2024. Connecting therapists with patients who need care.
          </p>
        </div>
      </section>
    </div>
  );
}
