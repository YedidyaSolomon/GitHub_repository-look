"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Service, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ServiceTable from "@/components/business/service-table";
import { Spinner } from "@/components/ui/spinner";

export default function ServicesPage() {
  const { business, loading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  useEffect(() => {
    if (business) {
      fetchServices();
    }
  }, [business]);

  const fetchServices = async () => {
    if (!business) return;
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setTableLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!business) {
    return <div>No business found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your therapy services</p>
        </div>
        <Button asChild>
          <Link href="./new">+ Add New Service</Link>
        </Button>
      </div>

      <ServiceTable
        services={services}
        businessId={business.id}
        setServices={setServices}
        onEdit={(serviceId) => router.push(`./${serviceId}/edit`)}
        onDelete={fetchServices}
      />
    </div>
  );
}
