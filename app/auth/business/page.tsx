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

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

function readableAuthError(err: unknown): string {
  if (err instanceof Error && 'message' in err) {
    const msg = err.message;
    const lower = msg.toLowerCase();

    if (
      lower.includes('rate limit') ||
      lower.includes('over_email_send') ||
      lower.includes('too many requests')
    ) {
      return 'Too many signup or email attempts from your connection. Supabase temporarily blocks this to prevent abuse. Wait about an hour, use a different network/VPN, or in Supabase Dashboard go to Authentication → Rate Limits and adjust limits for development.';
    }

    if (lower.includes('invalid') && (lower.includes('email') || lower.includes('login'))) {
      return `${msg} Check for extra spaces, copy-paste issues, or try typing the address again.`;
    }

    return msg;
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message: string }).message;
    if (typeof m === 'string' && m) return readableAuthError(new Error(m));
  }

  return 'Authentication failed';
}

export default function BusinessAuth() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [tin, setTin] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailNorm = normalizeEmail(email);

      if (isSignup) {
        // Validate form
        if (!fullName || !emailNorm || !phone || !physicalAddress || !tin || !password) {
          throw new Error('All fields are required');
        }

        if (!EMAIL_RE.test(emailNorm)) {
          throw new Error('Please enter a valid email address (e.g. name@gmail.com).');
        }

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        if (tin.length !== 10 || !/^\d{10}$/.test(tin)) {
          throw new Error('TIN must be exactly 10 digits');
        }

        // Sign up (normalized email avoids hidden spaces / casing issues)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailNorm,
          password,
        });

        if (authError) throw authError;

        // Create profile with BUSINESS role
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: emailNorm,
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
              name: fullName.trim(),
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
        if (!emailNorm) {
          throw new Error('Enter your email address.');
        }
        if (!EMAIL_RE.test(emailNorm)) {
          throw new Error('Please enter a valid email address.');
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: emailNorm,
          password,
        });

        if (authError) throw authError;
        router.push('/dashboard/business');
      }
    } catch (err) {
      setError(readableAuthError(err));
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

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
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
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : undefined}
              />
            </div>

            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={loading}>
              {loading ? 'Processing...' : isSignup ? 'Register Business' : 'Sign In'}
            </Button>
          </form>

          <button
            type="button"
            onClick={    () => {
              setIsSignup(!isSignup);
              setError(null);
              setFullName('');
              setPhone('');
              setPhysicalAddress('');
              setTin('');
              setPassword('');
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
