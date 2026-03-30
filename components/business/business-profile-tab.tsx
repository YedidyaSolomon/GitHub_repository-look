"use client";

import { useEffect, useState } from "react";
import { Business, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Building2, Upload, User } from "lucide-react";

interface BusinessProfileTabProps {
  business: Business;
  onBusinessUpdate?: (patch: Partial<Business>) => void;
}

export default function BusinessProfileTab({
  business,
  onBusinessUpdate,
}: BusinessProfileTabProps) {
  const { profile, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bizName, setBizName] = useState(business.name);
  const [address, setAddress] = useState(business.physical_address || "");
  const [description, setDescription] = useState(business.description || "");
  const [logoUrl, setLogoUrl] = useState(business.logo_url || "");

  useEffect(() => {
    if (!profile) return;
    setOwnerName(profile.full_name || profile.name || "");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
  }, [profile]);

  useEffect(() => {
    setBizName(business.name);
    setAddress(business.physical_address || "");
    setDescription(business.description || "");
    setLogoUrl(business.logo_url || "");
  }, [business]);

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please choose an image file.",
      });
      return;
    }
    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `business-logos/${business.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("service-images")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("service-images").getPublicUrl(path);
      setLogoUrl(publicUrl);
      toast({
        title: "Logo uploaded",
        description: "Save your profile to apply the logo to your business.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not upload logo.",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const profilePatch: Record<string, string | null> = {
        full_name: ownerName.trim(),
        name: ownerName.trim(),
        phone: phone.trim() || null,
        avatar_url: logoUrl || null,
      };

      const { error: pErr } = await supabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", profile.id);
      if (pErr) throw pErr;

      if (email.trim() && email.trim() !== profile.email) {
        const { error: authErr } = await supabase.auth.updateUser({
          email: email.trim(),
        });
        if (authErr) {
          toast({
            variant: "destructive",
            title: "Email update",
            description:
              authErr.message ||
              "Profile saved; email change may require confirmation from your inbox.",
          });
        }
        await supabase
          .from("profiles")
          .update({ email: email.trim() })
          .eq("id", profile.id);
      }

      const businessPatch: Record<string, string | null> = {
        name: bizName.trim(),
        physical_address: address.trim() || null,
        description: description.trim() || null,
        logo_url: logoUrl || null,
      };

      const { error: bErr } = await supabase
        .from("businesses")
        .update(businessPatch)
        .eq("id", business.id);
      if (bErr) throw bErr;

      onBusinessUpdate?.({
        name: bizName.trim(),
        physical_address: address.trim() || undefined,
        description: description.trim() || null,
        logo_url: logoUrl || null,
      });

      await refreshUser();
      toast({
        title: "Profile updated",
        description: "Your business and contact details have been saved.",
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save changes.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" />
            Business profile
          </CardTitle>
          <CardDescription>
            This is what clients see in discovery. Keep details accurate and professional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="space-y-2">
              <Label>Business logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className="object-cover size-24"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Building2 className="size-8 opacity-50" />
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-xs cursor-pointer"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleLogoUpload(f);
                    }}
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    PNG or JPG. Stored securely in your media library.
                  </p>
                  {uploadingLogo && (
                    <p className="text-xs flex items-center gap-1 mt-2">
                      <Spinner /> Uploading…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bizName">Business name</Label>
              <Input
                id="bizName"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Physical address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city, region"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bizDesc">Short description</Label>
              <Textarea
                id="bizDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="How you help clients — one or two calm sentences."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-primary" />
            Owner contact
          </CardTitle>
          <CardDescription>Used for bookings and account notices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Changing email may trigger a confirmation link from Supabase Auth.
              </p>
            </div>
          </div>

          <Button className="gap-2" onClick={() => void handleSave()} disabled={loading || uploadingLogo}>
            {loading ? <Spinner /> : <Upload className="size-4" />}
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
