"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ServiceForm from "@/components/business/service-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function NewServicePage() {
  const { business, loading } = useAuth();
  const router = useRouter();

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

  const handleSubmit = async (data: Partial<any>) => {
    // ServiceForm handles submit
    router.push("./");
  };

  const handleCancel = () => {
    router.push("./");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Service</h1>
          <p className="text-muted-foreground">
            Add a new therapy service to your business
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="./">Cancel</Link>
        </Button>
      </div>

      <ServiceForm
        businessId={business.id}
        service={null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
