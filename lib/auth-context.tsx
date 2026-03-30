'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase, type Profile, type Business } from './supabase';

interface AuthContextType {
  profile: Profile | null;
  business: Business | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  /** Refetch profile + business without toggling initial loading (e.g. after Chapa return). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setProfile(null);
        setBusiness(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('Failed to load profile');
        setProfile(null);
        setBusiness(null);
        return;
      }

      setProfile(profileData);

      if (profileData?.role === 'BUSINESS') {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', session.user.id)
          .single();

        if (!businessError && businessData) {
          setBusiness(businessData);
        } else {
          setBusiness(null);
        }
      } else {
        setBusiness(null);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Authentication failed');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUserData(false);
  }, [loadUserData]);

  useEffect(() => {
    void loadUserData(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setBusiness(null);
          setLoading(false);
        } else if (session?.user) {
          await loadUserData(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setBusiness(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ profile, business, loading, error, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
