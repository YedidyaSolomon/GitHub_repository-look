"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LogOut,
  Menu,
  User,
  ChevronDown,
  Home,
  List,
  Info,
  Users,
  Mail,
  Building2,
  UserPlus,
} from "lucide-react";

export default function NavBar() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!profile) return "/auth/customer";
    switch (profile.role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "BUSINESS":
        return "/dashboard/business";
      case "CUSTOMER":
        return "/dashboard/customer";
      default:
        return "/dashboard/customer";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
            DH
          </div>
          <span className="font-bold text-xl hidden md:inline">Dvora Hub</span>
        </Link>

        {/* Desktop Nav & CTA */}
        <div className="hidden lg:flex items-center gap-8">
          {/* Nav Links */}
          <nav className="flex gap-1 text-lg font-medium">
            <Link
              href="/"
              className="text-muted-foreground hover:text-[var(--purple)] px-3 py-2 rounded-md transition-all hover:bg-muted/50"
            >
              Home
            </Link>
            <Link
              href="#featured"
              className="text-muted-foreground hover:text-[var(--purple)] px-3 py-2 rounded-md transition-all hover:bg-muted/50"
            >
              Services
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-[var(--purple)] px-3 py-2 rounded-md transition-all hover:bg-muted/50"
            >
              How It Works
            </Link>
            <Link
              href="#about"
              className="text-muted-foreground hover:text-[var(--purple)] px-3 py-2 rounded-md transition-all hover:bg-muted/50"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-muted-foreground hover:text-[var(--purple)] px-3 py-2 rounded-md transition-all hover:bg-muted/50"
            >
              Contact
            </Link>
          </nav>
          {/* CTAs */}
          <div className="flex items-center gap-2">
            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block ml-2 max-w-24 truncate">
                      {profile.full_name}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-1 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.full_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/customer">
                  <Button variant="ghost" size="sm" className="h-10 px-3">
                    Login
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="h-10 bg-[var(--purple)] hover:bg-[var(--purple)]/90"
                    >
                      Register
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/auth/customer">
                        <User className="mr-2 h-4 w-4" />
                        As Customer
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/business">
                        <Building2 className="mr-2 h-4 w-4" />
                        As Business
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 p-0"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
            <div className="flex flex-col h-full">
              {/* Mobile Logo */}
              <div className="p-6 border-b border-border">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[var(--purple)] to-[var(--gold)] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    DH
                  </div>
                  <span className="font-bold text-xl">Dvora Hub</span>
                </Link>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 p-6 flex flex-col gap-4">
                <Link
                  href="/"
                  className="text-lg font-medium hover:text-[var(--purple)] px-3 py-3 rounded-md transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="#featured"
                  className="text-lg font-medium hover:text-[var(--purple)] px-3 py-3 rounded-md transition-colors"
                >
                  Services
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-lg font-medium hover:text-[var(--purple)] px-3 py-3 rounded-md transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="#about"
                  className="text-lg font-medium hover:text-[var(--purple)] px-3 py-3 rounded-md transition-colors"
                >
                  About
                </Link>
                <Link
                  href="#contact"
                  className="text-lg font-medium hover:text-[var(--purple)] px-3 py-3 rounded-md transition-colors"
                >
                  Contact
                </Link>
              </nav>

              {/* Mobile CTA */}
              <div className="p-6 border-t border-border">
                <div className="flex flex-col gap-3">
                  {profile ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-12 px-4"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Log out
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link href="/auth/customer">
                        <Button className="w-full h-12 bg-[var(--purple)] hover:bg-[var(--purple)]/90">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                      </Link>
                      <Link href="/auth/business">
                        <Button variant="outline" className="w-full h-12">
                          <Building2 className="mr-2 h-4 w-4" />
                          Register Business
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
