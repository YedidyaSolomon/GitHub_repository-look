"use client";

import { useEffect, useState } from "react";
import { Service, Specialist, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ServiceImageUploader from "./service-image-uploader";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  "Mental Health",
  "Physical Therapy",
  "Counseling",
  "Sports Medicine",
  "Occupational Therapy",
  "Speech Therapy",
  "Back Pain",
  "Other",
] as const;

interface ServiceFormProps {
  businessId: string;
  service?: Service | null;
  onSubmit: (data: Partial<Service>) => Promise<void>;
  onCancel?: () => void;
}

export default function ServiceForm({
  businessId,
  service,
  onSubmit,
  onCancel,
}: ServiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(
    service?.image_urls || [],
  );
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    duration_minutes: service?.duration_minutes || 60,
    price: service?.price || 0,
    category: service?.category || "Mental Health",
    specialist: service?.specialist || "",
  });

  useEffect(() => {
    fetchSpecialists();
  }, [businessId]);

  const fetchSpecialists = async () => {
    const { data } = await supabase
      .from("specialists")
      .select("*")
      .eq("business_id", businessId);
    setSpecialists(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        image_urls: imageUrls,
        business_id: businessId, // for create
      };

      await onSubmit(data);
      toast({
        title: service ? "Updated" : "Created",
        description: `${service ? "Service" : "New service"} saved successfully.`,
      });
    } catch (error) {
      console.error("Form submit error:", error);
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
      <CardHeader>
        <CardTitle>{service ? "Edit Service" : "New Service"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                placeholder="e.g. Spinal Therapy"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the service..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="specialist">Specialist</Label>
              <Select
                value={formData.specialist}
                onValueChange={(value) =>
                  setFormData({ ...formData, specialist: value })
                }
              >
                <SelectTrigger id="specialist">
                  <SelectValue placeholder="Select specialist" />
                </SelectTrigger>
                <SelectContent>
                  {specialists.map((spec) => (
                    <SelectItem key={spec.id} value={spec.name}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <ServiceImageUploader
                existingImages={imageUrls}
                onImagesChange={setImageUrls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value) || 60,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Saving..." : "Save Service"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
