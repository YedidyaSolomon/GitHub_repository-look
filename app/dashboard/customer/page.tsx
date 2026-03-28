'use client';

import { useEffect, useState } from 'react';
import { Business, Service, Specialist, supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Search, Calendar } from 'lucide-react';
import BookingModal from '@/components/customer/booking-modal';
import BusinessCard from '@/components/customer/business-card';

export default function CustomerDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchApprovedBusinesses();
  }, []);

  const fetchApprovedBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'APPROVED')
        .eq('subscription_status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setBusinesses(data);
        setFilteredBusinesses(data);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredBusinesses(filtered);
  };

  const handleBookService = (service: Service, specialist: Specialist) => {
    setSelectedService(service);
    setSelectedSpecialist(specialist);
    setShowBookingModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find Therapy Services</CardTitle>
          <CardDescription>
            Search for therapy businesses and specialists near you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by business name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Available Services {filteredBusinesses.length > 0 && `(${filteredBusinesses.length})`}
        </h2>

        {filteredBusinesses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No businesses found matching your search'
                  : 'No active therapy services available at the moment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onBookService={handleBookService}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedService && selectedSpecialist && (
        <BookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          service={selectedService}
          specialist={selectedSpecialist}
        />
      )}
    </div>
  );
}
