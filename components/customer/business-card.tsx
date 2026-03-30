'use client';

import { useEffect, useState } from 'react';
import { Business, Service, Specialist, supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import Link from "next/link";
import { Calendar, Users } from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  onBookService: (service: Service, specialist: Specialist) => void;
}

export default function BusinessCard({ business, onBookService }: BusinessCardProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, specialistsData] = await Promise.all([
          supabase.from('services').select('*').eq('business_id', business.id),
          supabase
            .from('specialists')
            .select('*')
            .eq('business_id', business.id)
            .eq('availability', true),
        ]);

        if (servicesData.data) setServices(servicesData.data);
        if (specialistsData.data) setSpecialists(specialistsData.data);
      } catch (err) {
        console.error('Error fetching business data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [business.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-64">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{business.name}</CardTitle>
        <CardDescription className="line-clamp-2">{business.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Services
            </div>
            <div className="text-2xl font-bold">{services.length}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              Specialists
            </div>
            <div className="text-2xl font-bold">{specialists.length}</div>
          </div>
        </div>

        {/* View Full Profile Button */}
        <Button asChild variant="outline" size="sm" className="w-full mt-2">
<Link href={`/business/${business.id}`}>
            View Full Profile & Book →
          </Link>
        </Button>

        {/* Services List */}
        {services.length > 0 && specialists.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Available Services</h4>
            {services.slice(0, 3).map((service) => (
              <div
                key={service.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-accent transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {service.duration_minutes} mins
                    </p>
                  </div>
                  <Badge variant="secondary">₦{service.price}</Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onBookService(service, specialists[0])}
                >
                  Book Now
                </Button>
              </div>
            ))}
            {services.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{services.length - 3} more services available
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No available services at the moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
