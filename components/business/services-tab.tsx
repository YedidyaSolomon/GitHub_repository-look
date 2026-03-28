"use client";

import { useState } from "react";
import { Service, supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ServiceForm from "./service-form";
import ServiceTable from "./service-table";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface ServicesTabProps {
  businessId: string;
  services: Service[];
  setServices: (services: Service[]) => void;
}

export default function ServicesTab({
  businessId,
  services,
  setServices,
}: ServicesTabProps) {
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingService(null);
  };

  const handleServiceSubmit = async (data: Partial<Service>) => {
    setLoading(true);

    try {
      if (editingService?.id) {
        // Update
        const { error } = await supabase
          .from("services")
          .update(data)
          .eq("id", editingService.id)
          .eq("business_id", businessId);

        if (error) throw error;

        setServices(
          services.map((s) =>
            s.id === editingService.id ? { ...s, ...data } : s,
          ),
        );
        toast({
          title: "Updated",
          description: "Service updated successfully.",
        });
      } else {
        // Insert
        const { data: newService, error } = await supabase
          .from("services")
          .insert({ business_id: businessId, ...data })
          .select()
          .single();

        if (error) throw error;
        if (newService) {
          setServices([...services, newService]);
          toast({
            title: "Created",
            description: "New service created successfully.",
          });
        }
      }

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving service:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save service.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Services</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit" : "Add"} Service
              </DialogTitle>
            </DialogHeader>
            <ServiceForm
              businessId={businessId}
              service={editingService}
              onSubmit={handleServiceSubmit}
              onCancel={resetForm}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No services yet. Add your first service to get started.
          </div>
        ) : (
          <ServiceTable
            services={services}
            businessId={businessId}
            setServices={setServices}
            onEdit={(serviceId) => {
              const service = services.find((s) => s.id === serviceId);
              setEditingService(service || null);
              setOpen(true);
            }}
            onDelete={() => {}}
          />
        )}
      </CardContent>
    </Card>
  );
}
