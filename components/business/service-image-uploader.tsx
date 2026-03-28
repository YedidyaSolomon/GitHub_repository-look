"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ServiceImageUploaderProps {
  onImagesChange?: (urls: string[]) => void;
  existingImages?: string[];
}

export default function ServiceImageUploader({
  onImagesChange,
  existingImages = [],
}: ServiceImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);

  const handleUpload = useCallback(
    async (files: File[]) => {
      setUploading(true);
      const uploadedUrls: string[] = [...images];

      try {
        for (const file of files) {
          const fileExt = file.name.split(".").pop();
          const fileName = `service-images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("service-images")
            .upload(fileName, file, { upsert: true });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("service-images").getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
        }

        setImages(uploadedUrls);
        onImagesChange?.(uploadedUrls);
        toast({
          title: "Success",
          description: `${files.length} image(s) uploaded.`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload images.",
        });
      } finally {
        setUploading(false);
      }
    },
    [images, onImagesChange],
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                handleUpload(Array.from(e.target.files));
              }
            }}
            disabled={uploading}
            className="hidden"
          />

          <Button
            type="button"
            asChild
            variant="outline"
            className="w-full"
            disabled={uploading}
          >
            <label htmlFor="images">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Images"}
            </label>
          </Button>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt="Service image"
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No images uploaded yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
