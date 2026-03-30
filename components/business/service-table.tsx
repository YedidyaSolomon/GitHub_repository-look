"use client";

import { useState } from "react";
import { Service, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Edit,
  Trash2,
  Eye,
  X,
} from "lucide-react";

interface ServiceTableProps {
  services: Service[];
  businessId: string;
  onEdit: (serviceId: string) => void;
  onDelete: (serviceId: string) => void;
  setServices?: React.Dispatch<React.SetStateAction<Service[]>>;
}

export default function ServiceTable({
  services,
  businessId,
  onEdit,
  onDelete,
  setServices,
}: ServiceTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteImage = async (serviceId: string, imageUrl: string) => {
    if (!setServices) return;

    setDeletingImage(true);
    try {
      // Update service to remove image from array
      const service = services.find((s) => s.id === serviceId);
      if (!service?.image_urls) return;

      const newImageUrls = service.image_urls!.filter(
        (url) => url !== imageUrl,
      );

      const { error } = await supabase
        .from("services")
        .update({ image_urls: newImageUrls })
        .eq("id", serviceId)
        .eq("business_id", businessId);

      if (error) throw error;

      // Optimistic update
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId ? { ...s, image_urls: newImageUrls } : s,
        ),
      );

      toast({ title: "Deleted", description: "Image removed successfully." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete image.",
      });
    } finally {
      setDeletingImage(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId)
        .eq("business_id", businessId);

      if (error) throw error;

      onDelete(serviceId);
      toast({ title: "Deleted", description: "Service deleted successfully." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service.",
      });
    }
    setDeleteDialog(null);
  };

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Services</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No services found. Add your first service to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Your Services ({services.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Specialist</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {service.category || "Uncategorized"}
                  </Badge>
                </TableCell>
                <TableCell>{service.specialist || "-"}</TableCell>
                <TableCell>{service.duration_minutes} min</TableCell>
                <TableCell>₦{service.price.toFixed(2)}</TableCell>
                <TableCell>{formatDate(service.created_at)}</TableCell>
                <TableCell>
                  {service.image_urls && service.image_urls.length > 0 ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          {service.image_urls.length}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Service Images</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4">
                          {service.image_urls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt=""
                                className="w-full h-32 object-cover rounded-md"
                              />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    disabled={deletingImage}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Image?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This image will be removed from the
                                      service.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteImage(service.id, url)
                                      }
                                      disabled={deletingImage}
                                    >
                                      {deletingImage ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No images
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(service.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the service and its images.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
