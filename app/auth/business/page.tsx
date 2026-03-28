'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Building2, Mail, Lock, User, Phone, MapPin, FileText } from 'lucide-react';

export default function BusinessAuth() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [tin, setTin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        // Validate form
        if (!fullName || !email || !phone || !businessName || !physicalAddress || !tin || !password || !confirmPassword) {
          throw new Error('All fields are required');
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        if (tin.length !== 10 || !/^\d{10}$/.test(tin)) {
          throw new Error('TIN must be exactly 10 digits');
        }

        // Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        // Create profile with BUSINESS role
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email,
              name: fullName,
              phone,
              role: 'BUSINESS',
            });

          if (profileError) throw profileError;

          // Create business with PENDING status
          const { error: businessError } = await supabase
            .from('businesses')
            .insert({
              owner_id: authData.user.id,
              name: businessName,
              physical_address: physicalAddress,
              tin,
              status: 'PENDING',
              subscription_status: 'INACTIVE',
            });

          if (businessError) throw businessError;
        }

        // Redirect to pending approval page
        router.push('/pending');
      } else {
        // Sign in
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        router.push('/dashboard/business');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Building2 className="w-6 h-6 text-secondary-foreground" />
            {isSignup ? 'Register Your Business' : 'Business Sign In'}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? 'List your therapy business and reach more clients'
              : 'Sign in to manage your business'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Owner name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="+234 (0) 123 456 7890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Business Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Wellness Therapy Centre"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Physical Address
                  </label>
                  <Input
                    type="text"
                    placeholder="123 Main Street, City, State"
                    value={physicalAddress}
                    onChange={(e) => setPhysicalAddress(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    TIN (Tax ID) - 10 digits
                  </label>
                  <Input
                    type="text"
                    placeholder="0000000000"
                    maxLength={10}
                    value={tin}
                    onChange={(e) => setTin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be exactly 10 digits. Will be verified during approval.
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="business@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isSignup && (
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={loading}>
              {loading ? 'Processing...' : isSignup ? 'Register Business' : 'Sign In'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
              setFullName('');
              setPhone('');
              setBusinessName('');
              setPhysicalAddress('');
              setTin('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-secondary-foreground hover:underline w-full text-center"
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>

          <Link href="/" className="block">
            <Button variant="ghost" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
