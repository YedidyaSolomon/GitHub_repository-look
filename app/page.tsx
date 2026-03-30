"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HeroSearch from "@/components/landing/hero-search";
import StepsSection from "@/components/landing/steps-section";
import MapSection from "@/components/landing/map-section";
import TestimonialsSection from "@/components/landing/testimonials-section";
import Image from "next/image";
import BusinessCard from "@/components/customer/business-card";

interface SimpleBusiness {
  id: string;
  name: string;
  description: string;
  address: string;
  category: string;
  phone: string;
}

const mockFeaturedBusinesses: SimpleBusiness[] = [
  {
    id: "1",
    name: "Lagos Wellness Center",
    description:
      "Comprehensive therapy and wellness services with 20+ certified professionals",
    address: "Victoria Island, Lagos",
    category: "Counseling & Psychotherapy",
    phone: "+234 801 234 5678",
  },
  {
    id: "2",
    name: "Peace Therapy Clinic",
    description:
      "Individual counseling, family therapy, and cognitive behavioral therapy",
    address: "Ikeja GRA, Lagos",
    category: "Mental Health",
    phone: "+234 802 345 6789",
  },
  {
    id: "3",
    name: "Harmony Massage & Spa",
    description:
      "Professional massage therapy, acupuncture, and relaxation services",
    address: "Lekki Phase 1, Lagos",
    category: "Physical Wellness",
    phone: "+234 803 456 7890",
  },
  {
    id: "4",
    name: "Mindful Yoga Studio",
    description: "Yoga classes, meditation sessions, and mindfulness workshops",
    address: "Ikoyi, Lagos",
    category: "Mindfulness & Yoga",
    phone: "+234 804 567 8901",
  },
  {
    id: "5",
    name: "Elite Physiotherapy",
    description: "Sports physiotherapy, rehabilitation, and pain management",
    address: "Surulere, Lagos",
    category: "Physiotherapy",
    phone: "+234 805 678 9012",
  },
  {
    id: "6",
    name: "Serenity Counseling",
    description: "Marriage counseling, child therapy, and life coaching",
    address: "Yaba, Lagos",
    category: "Family Therapy",
    phone: "+234 806 789 0123",
  },
];

export default function LandingPage() {
  const handleBookDemo = (business: SimpleBusiness) => {
    console.log("Book:", business);
    // Mock booking modal
    alert(
      `Booking demo for ${business.name} - Visit /dashboard/customer for real booking!`,
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-24 pb-32 overflow-hidden bg-gradient-to-br from-background via-white to-muted/70">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_-10%,rgba(139,92,246,0.08),transparent)]" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-5xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-[var(--purple)] via-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent mb-8 leading-tight">
              Find Trusted
              <br />
              <span className="text-6xl md:text-8xl lg:text-9xl">Therapy</span>
              <br />
              Services Near You
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed opacity-90 font-medium">
              Connect with verified therapists and wellness providers.{" "}
              <span className="font-bold text-[var(--purple)]">
                Book instantly as guest
              </span>{" "}
              or registered user. No account required.
            </p>
          </div>
          <HeroSearch />
          <div className="flex flex-wrap gap-4 md:gap-8 mt-16 pt-16 border-t border-border/50 justify-center items-center">
            <div className="text-left md:text-center">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 border-2 border-primary/30 bg-primary/5 text-primary font-semibold"
              >
                Guest Booking Available
              </Badge>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                No registration needed
              </p>
            </div>
            <div className="text-left md:text-center">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 border-2 border-success/30 bg-success/5 text-success font-semibold"
              >
                Secure & Verified
              </Badge>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                Admin approved providers
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="font-bold text-lg px-12">
                <Link href="#featured">Explore Services</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="font-bold text-lg px-10">
                <Link href="/book">Book a visit (guest)</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <StepsSection />

      {/* Featured Services */}
      <section id="featured" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent mb-6">
              Featured Therapy Providers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Top rated businesses with real-time availability
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {mockFeaturedBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business as any}
                onBookService={(service, specialist) =>
                  handleBookDemo(business as any)
                }
              />
            ))}
          </div>
          <div className="text-center mt-20">
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard/customer">Browse All 500+ Providers</Link>
            </Button>
          </div>
        </div>
      </section>

      <MapSection />

      {/* Business Promotion */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-r from-[var(--purple)] via-[var(--purple)] to-[var(--gold)]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPgo=')] opacity-20" />
        <div className="container mx-auto px-6 relative z-10 text-center text-primary-foreground">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
              Therapists & Wellness Providers
            </h2>
            <p className="text-2xl opacity-95 mb-12 leading-relaxed">
              Join{" "}
              <span className="font-black text-3xl bg-gradient-to-r from-white/30 to-white/60 bg-clip-text text-transparent">
                Dvora Hub
              </span>{" "}
              and grow your business.
            </p>
            <p className="text-xl opacity-90 mb-16 max-w-2xl mx-auto leading-relaxed">
              List your services, manage appointments, reach new clients. Admin
              approval ensures quality.
            </p>
            <Link href="/auth/business">
              <Button
                size="2xl"
                className="text-2xl px-16 py-10 font-bold shadow-2xl hover:shadow-3xl bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/20"
              >
                Start Your Business Profile
              </Button>
            </Link>
            <p className="mt-12 text-lg opacity-80">
              Already registered?{" "}
              <Link
                href="/dashboard/business"
                className="underline hover:no-underline font-semibold"
              >
                Go to dashboard
              </Link>
            </p>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* Booking Notice */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-6 max-w-4xl">
          <Card className="backdrop-blur-sm bg-card/90 border-0 shadow-2xl overflow-hidden">
            <div className="p-2 bg-gradient-to-r from-primary/10 to-[var(--gold)]/10 border-b border-primary/20">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-6 py-4 rounded-xl border border-primary/30">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                <span className="text-lg font-bold text-primary">
                  Booking Made Simple
                </span>
              </div>
            </div>
            <CardContent className="p-12 md:p-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-black mb-6 bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent">
                  Book Without Registration
                </h3>
                <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                  Customers can book services immediately as guests.
                  <br />
                  <span className="font-bold text-foreground">
                    Create an account anytime
                  </span>{" "}
                  to save bookings, view history, and manage preferences.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-2xl hover:bg-muted">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="font-bold text-primary text-lg">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Guest Booking</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Enter name, email, phone. Book instantly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-6 bg-muted/50 rounded-2xl hover:bg-muted">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="font-bold text-secondary text-lg">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Account Benefits</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      History, favorites, repeat booking, reviews.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="px-12 pb-12 text-center">
              <Button size="lg" className="font-bold">
                Start Booking Now
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16 mt-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-start text-left md:text-center">
            <div>
              <div className="flex items-center justify-center mb-8">
                <Image
                  src="/devora1.jpg"
                  alt="Dvora Hub"
                  width={200}
                  height={50}
                  className="h-12 w-auto max-w-[200px] object-contain"
                  priority
                />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Connecting customers with trusted therapy and wellness
                providers. Book easily, securely.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Customer</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/dashboard/customer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Business</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/auth/business"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/business"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-lg mb-6">Contact</h5>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="mailto:support@dvorahub.com"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    support@dvorahub.com
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +234 800 DVORA
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 mt-16 pt-12 text-center text-sm text-muted-foreground">
            <p>
              &copy; 2024 Dvora Hub. All rights reserved. Therapy marketplace
              for Nigeria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
