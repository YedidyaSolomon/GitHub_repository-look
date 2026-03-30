"use client";

import { useEffect, useMemo, useState } from "react";
import { Service, Specialist, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import ServiceImageUploader from "./service-image-uploader";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Users } from "lucide-react";

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

function parseAssignedNames(specialistField: string | undefined): Set<string> {
  if (!specialistField?.trim()) return new Set();
  return new Set(
    specialistField
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

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
  const [assignedNames, setAssignedNames] = useState<Set<string>>(() =>
    parseAssignedNames(service?.specialist),
  );
  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    duration_minutes: service?.duration_minutes || 60,
    price: service?.price || 0,
    category: service?.category || "Mental Health",
  });

  useEffect(() => {
    setFormData({
      name: service?.name || "",
      description: service?.description || "",
      duration_minutes: service?.duration_minutes || 60,
      price: service?.price || 0,
      category: service?.category || "Mental Health",
    });
    setImageUrls(service?.image_urls || []);
    setAssignedNames(parseAssignedNames(service?.specialist));
  }, [service]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("specialists")
        .select("*")
        .eq("business_id", businessId);
      setSpecialists(data || []);
    })();
  }, [businessId]);

  const specialistSummary = useMemo(
    () => Array.from(assignedNames).sort().join(", "),
    [assignedNames],
  );

  const toggleSpecialist = (name: string, checked: boolean) => {
    setAssignedNames((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (specialists.length > 0 && assignedNames.size === 0) {
      toast({
        variant: "destructive",
        title: "Assign specialists",
        description: "Select at least one specialist who delivers this service.",
      });
      return;
    }
    setLoading(true);

    try {
      const data: Partial<Service> = {
        ...formData,
        image_urls: imageUrls,
        specialist: specialistSummary || undefined,
        business_id: businessId,
      };

      await onSubmit(data);
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
    <div className="space-y-6">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Service name</Label>
            <Input
              id="name"
              placeholder="e.g. Spinal therapy session"
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
            placeholder="What clients can expect — calm, clear language."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <Label>Assigned specialists</Label>
          </div>
          <p className="text-muted-foreground text-xs">
            Choose who can deliver this service. Add team members in the Team
            section on the Services page if the list is empty.
          </p>
          {specialists.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              No specialists yet. Create specialists first, then assign them here.
            </p>
          ) : (
            <ScrollArea className="h-[min(200px,40vh)] rounded-md border p-3">
              <ul className="space-y-3">
                {specialists.map((spec) => (
                  <li key={spec.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`spec-${spec.id}`}
                      checked={assignedNames.has(spec.name)}
                      onCheckedChange={(v) =>
                        toggleSpecialist(spec.name, v === true)
                      }
                    />
                    <label
                      htmlFor={`spec-${spec.id}`}
                      className="text-sm leading-tight cursor-pointer"
                    >
                      <span className="font-medium">{spec.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {spec.email}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label>Images</Label>
            <p className="text-muted-foreground text-xs">
              Uploads go to the <code className="text-xs">service-images</code>{" "}
              bucket with live progress.
            </p>
            <ServiceImageUploader
              existingImages={imageUrls}
              onImagesChange={setImageUrls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              step={5}
              value={formData.duration_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration_minutes: parseInt(e.target.value, 10) || 60,
                })
              }
              required
            />
            <p className="text-muted-foreground text-xs">
              Default session length; booking slots use this with specialist
              calendars.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min={0}
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="sm:flex-1" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? "Saving…" : service ? "Update service" : "Add service"}
          </Button>
        </div>
      </form>
    </div>
  );
}
