import React from "react";

/**
 * Videon mark — instrument module: hairline frame + registration ticks,
 * a signal trace running through the play cue, and a tally LED.
 * Frame is currentColor-driven, accents use the --signal token.
 */
const LogoMark = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Frame */}
    <rect
      x="1.5"
      y="1.5"
      width="45"
      height="45"
      rx="10"
      stroke="currentColor"
      strokeOpacity="0.6"
      strokeWidth="1.5"
    />
    {/* Registration ticks — top-left + bottom-right */}
    <path
      d="M7.5 7.5 V11.5 M7.5 7.5 H11.5"
      stroke="currentColor"
      strokeOpacity="0.6"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    <path
      d="M40.5 40.5 V36.5 M40.5 40.5 H36.5"
      stroke="currentColor"
      strokeOpacity="0.6"
      strokeWidth="1.5"
      strokeLinecap="square"
    />
    {/* Signal trace — runs beneath the play cue */}
    <path
      d="M9 24 H39"
      stroke="var(--signal)"
      strokeOpacity="0.9"
      strokeWidth="2"
      strokeLinecap="square"
    />
    {/* Play cue */}
    <path d="M20 15.5 L20 32.5 L34 24 Z" fill="var(--signal)" />
    {/* Tally LED */}
    <circle cx="35.5" cy="10.5" r="2.2" fill="var(--signal)" />
  </svg>
));

LogoMark.displayName = "LogoMark";

export default LogoMark;