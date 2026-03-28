'use client';

import { useEffect, useState, useCallback } from 'react';
import { Specialist, supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealTimeAvailability(businessId: string) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        const { data, error } = await supabase
          .from('specialists')
          .select('*')
          .eq('business_id', businessId);

        if (error) throw error;
        if (data) setSpecialists(data);
      } catch (err) {
        console.error('Error fetching specialists:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
  }, [businessId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const realtimeChannel = supabase
      .channel(`specialists-${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specialists',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSpecialists((prev) =>
              prev.map((spec) =>
                spec.id === payload.new.id ? (payload.new as Specialist) : spec
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setSpecialists((prev) => [...prev, payload.new as Specialist]);
          } else if (payload.eventType === 'DELETE') {
            setSpecialists((prev) => prev.filter((spec) => spec.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [businessId]);

  const updateAvailability = useCallback(
    async (specialistId: string, availability: boolean) => {
      try {
        const { error } = await supabase
          .from('specialists')
          .update({ availability })
          .eq('id', specialistId);

        if (error) throw error;
      } catch (err) {
        console.error('Error updating availability:', err);
        throw err;
      }
    },
    []
  );

  return { specialists, loading, updateAvailability };
}
