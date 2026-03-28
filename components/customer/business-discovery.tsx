'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Star } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  image_url?: string;
  created_at: string;
}

interface BusinessDiscoveryProps {
  onSelectBusiness: (business: Business) => void;
}

const CATEGORIES = [
  'Mental Health',
  'Physical Therapy',
  'Counseling',
  'Sports Medicine',
  'Occupational Therapy',
  'Speech Therapy',
  'Other',
];

export default function BusinessDiscovery({ onSelectBusiness }: BusinessDiscoveryProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAddress, setSelectedAddress] = useState('all');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      // Fetch only APPROVED businesses with ACTIVE subscriptions
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'APPROVED')
        .eq('subscription_status', 'ACTIVE')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      if (data) {
        setBusinesses(data);
        setFilteredBusinesses(data);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  // Filter businesses based on search and filters
  useEffect(() => {
    let filtered = businesses;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    // Address filter
    if (selectedAddress !== 'all') {
      filtered = filtered.filter(b => b.address === selectedAddress);
    }

    setFilteredBusinesses(filtered);
  }, [searchQuery, selectedCategory, selectedAddress, businesses]);

  // Get unique addresses for filter
  const addresses = Array.from(new Set(businesses.map(b => b.address).filter(Boolean)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading businesses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search businesses by name or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Select value={selectedAddress} onValueChange={setSelectedAddress}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {addresses.map(addr => (
                <SelectItem key={addr} value={addr}>{addr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Found {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
      </div>

      {/* Businesses Grid */}
      <div className="grid gap-4">
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map(business => (
            <Card key={business.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      {business.address}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">4.5</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{business.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {business.category}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm">
                    <p className="font-medium">Phone: {business.phone}</p>
                  </div>
                  <Button
                    onClick={() => onSelectBusiness(business)}
                    variant="default"
                    size="sm"
                  >
                    View Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No businesses found matching your criteria.</p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedAddress('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
