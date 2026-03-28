'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function NavBar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getNavLinks = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'ADMIN':
        return (
          <Link href="/dashboard/admin" className="text-foreground hover:text-primary transition">
            Dashboard
          </Link>
        );
      case 'BUSINESS':
        return (
          <Link href="/dashboard/business" className="text-foreground hover:text-primary transition">
            My Business
          </Link>
        );
      case 'CUSTOMER':
        return (
          <Link href="/dashboard/customer" className="text-foreground hover:text-primary transition">
            Browse Services
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Therapy Marketplace
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {getNavLinks()}
          {profile && (
            <>
              <span className="text-sm text-muted-foreground">
                {profile.full_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border p-4 flex flex-col gap-4">
          {getNavLinks()}
          {profile && (
            <>
              <span className="text-sm text-muted-foreground">
                {profile.full_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
