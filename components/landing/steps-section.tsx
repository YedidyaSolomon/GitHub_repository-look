import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, UserCheck2, CalendarCheck, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search Therapy Services",
    desc: "Browse therapy and wellness services near you with advanced filters",
  },
  {
    icon: UserCheck2,
    title: "Choose Provider",
    desc: "Select therapist or business based on ratings, reviews and availability",
  },
  {
    icon: CalendarCheck,
    title: "Book Session",
    desc: "Book instantly as guest or logged in user - no account required",
  },
  {
    icon: Star,
    title: "Review & Return",
    desc: "Attend your session and leave feedback to help others",
  },
];

export default function StepsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] bg-clip-text text-transparent mb-6">
            How Dvora Hub Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            4 simple steps from discovering your perfect therapist to completing
            your session and sharing your experience
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-card/70 backdrop-blur-sm h-full overflow-hidden"
            >
              <div className="relative">
                <CardHeader className="pb-0 pt-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-[var(--purple)]/10 to-[var(--gold)]/10 group-hover:from-[var(--purple)]/20 group-hover:to-[var(--gold)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 border-2 border-transparent group-hover:border-[var(--purple)]/20">
                    <step.icon className="w-10 h-10 text-[var(--purple)] group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-[var(--purple)] transition-colors">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground leading-relaxed">
                    {step.desc}
                  </CardDescription>
                </CardHeader>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
