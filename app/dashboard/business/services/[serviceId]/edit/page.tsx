"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Service, supabase } from "@/lib/supabase";
import ServiceForm from "@/components/business/service-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { business, loading: authLoading } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const serviceId = params.serviceId as string;

  useEffect(() => {
    if (business && serviceId) {
      fetchService();
    }
  }, [business, serviceId]);

  const fetchService = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("business_id", business!.id)
      .single();

    if (error || !data) {
      notFound();
    } else {
      // Migrate old image_url
      if (data.image_url && !data.image_urls) {
        data.image_urls = [data.image_url];
      }
      setService(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (data: Partial<Service>) => {
    const { error } = await supabase
      .from("services")
      .update(data)
      .eq("id", serviceId);

    if (error) {
      console.error("Update error:", error);
    } else {
      router.push("../");
    }
  };

  const handleCancel = () => {
    router.push("../");
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (!business || !service) {
    return <div>Service not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Service</h1>
          <p className="text-muted-foreground">
            Update your therapy service details
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="../">Cancel</Link>
        </Button>
      </div>

      <ServiceForm
        businessId={business.id}
        service={service}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
