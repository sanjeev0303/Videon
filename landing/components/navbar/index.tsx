"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Logo from "@/components/logo";

const Navbar = () => {
  const { isSignedIn, isLoaded } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-hairline bg-ink/70 backdrop-blur-xl supports-backdrop-filter:bg-ink/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <Logo />
        </Link>

        {/* Navigation Links — channel labels */}
        <div className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Link
            href="#story"
            className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-signal after:transition-all after:duration-300 hover:after:w-full"
          >
            Why us?
          </Link>
          <Link
            href="#features"
            className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-signal after:transition-all after:duration-300 hover:after:w-full"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-signal after:transition-all after:duration-300 hover:after:w-full"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-signal after:transition-all after:duration-300 hover:after:w-full"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="relative py-1 transition-colors hover:text-foreground after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-signal after:transition-all after:duration-300 hover:after:w-full"
          >
            Docs
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <Button
              size="sm"
              variant="ghost"
              className="cursor-pointer px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              ...
            </Button>
          ) : isSignedIn ? (
            <Link href="http://localhost:3001" target="_blank">
              <Button
                size="sm"
                className="cursor-pointer bg-primary px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
              >
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signin">
                <Button
                  size="sm"
                  variant="ghost"
                  className="cursor-pointer px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="cursor-pointer bg-primary px-5 py-2 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/90"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;