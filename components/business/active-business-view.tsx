"use client";

import { useEffect, useState } from "react";
import { Business, supabase, Service, Specialist } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import ServicesTab from "./services-tab";
import SpecialistsTab from "./specialists-tab";
import BookingsTab from "./bookings-tab";
import SubscriptionGuard from "./subscription-guard";

interface ActiveBusinessViewProps {
  business: Business;
}

export default function ActiveBusinessView({
  business,
}: ActiveBusinessViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, specialistsData] = await Promise.all([
          supabase.from("services").select("*").eq("business_id", business.id),
          supabase
            .from("specialists")
            .select("*")
            .eq("business_id", business.id),
        ]);

        if (servicesData.data) setServices(servicesData.data);
        if (specialistsData.data) setSpecialists(specialistsData.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [business.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{business.name}</CardTitle>
          <CardDescription>{business.description}</CardDescription>
          <div className="flex items-center gap-2 mt-4">
            <Badge>Active</Badge>
            <Badge variant="outline">{business.subscription_plan} Plan</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="specialists">Specialists</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{services.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Specialists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{specialists.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {specialists.filter((s) => s.availability).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Button asChild>
                <Link href="/dashboard/business/services">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Services
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab("specialists")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Specialist
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <SubscriptionGuard business={business}>
            <ServicesTab
              businessId={business.id}
              services={services}
              setServices={setServices}
            />
          </SubscriptionGuard>
        </TabsContent>

        {/* Specialists Tab */}
        <TabsContent value="specialists">
          <SubscriptionGuard business={business}>
            <SpecialistsTab
              businessId={business.id}
              specialists={specialists}
              setSpecialists={setSpecialists}
            />
          </SubscriptionGuard>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <BookingsTab businessId={business.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
