"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Mother of 2, Regular Client",
    rating: 5,
    text: "Dvora Hub made finding the perfect therapist so easy. I could book as a guest and everything was seamless. The ratings and reviews helped me choose the right one!",
    avatar: "SJ",
  },
  {
    name: "Dr. Michael Lee",
    role: "Licensed Therapist",
    rating: 4.9,
    text: "As a therapist, this platform has been game-changing. Easy appointment management and new clients daily. The verification process builds trust with customers.",
    avatar: "ML",
  },
  {
    name: "Emily Chen",
    role: "Yoga Instructor Client",
    rating: 5,
    text: "Love the guest booking feature! No need to create account for quick sessions. Great selection of wellness providers and secure payments every time.",
    avatar: "EC",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent mb-6">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Don't just take our word for it. See what our customers and
            providers are saying about Dvora Hub.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 border-0 bg-card/80 backdrop-blur-sm overflow-hidden"
            >
              <CardHeader className="pb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--purple)]/5 to-[var(--gold)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < testimonial.rating ? "fill-[var(--gold)] text-[var(--gold)]" : "text-muted-foreground"} group-hover:text-[var(--gold)] transition-colors`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-lg mb-8 italic leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-[var(--purple)] transition-colors">
                      {testimonial.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {testimonial.role}
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
