"use client";
import * as React from "react";
import LogoMark from "./logo-mark";

type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Hide the wordmark, render only the mark (collapsed rails, footers). */
  iconOnly?: boolean;
};

/**
 * Videon identity lockup — instrument mark + Bricolage wordmark.
 * Fully theme-adaptive: the whole lockup inherits currentColor (set the
 * wrapper's text color for light/dark), the mark's accents use --signal.
 */
const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className = "", iconOnly = false, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center gap-2.5 select-none ${className}`}
      {...props}
    >
      <LogoMark className="h-7 w-7 shrink-0 text-current" />
      {!iconOnly && (
        <span className="font-display text-[1.05rem] font-semibold leading-none tracking-[-0.02em] text-current">
          Videon
        </span>
      )}
    </div>
  ),
);

Logo.displayName = "Logo";

export default Logo;