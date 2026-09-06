import React from "react";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="relative">
      <section className="relative flex min-h-[60vh] sm:min-h-[85vh] items-center overflow-hidden pt-20 pb-10 sm:pt-24">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-5 sm:px-6 md:grid-cols-2 lg:gap-16">
          {/* Left Column - High Information Density */}
          <div className="flex flex-col justify-center space-y-5 sm:space-y-8 animate-fadeSlideIn animation-delay-100">
            {/* Version Badge — tally light */}
            <span className="inline-flex w-fit items-center gap-2 rounded-sm border border-hairline bg-card/60 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground mb-2 sm:mb-6">
              <span className="tally-pulse h-1.5 w-1.5 rounded-full bg-signal"></span>
              v1.0.0 is now live
            </span>

            {/* Headline — solid signal accent, no gradient */}
            <h1 className="text-3xl leading-[1.15] tracking-tight font-light sm:text-5xl lg:text-6xl">
              Developer-first{" "}
              <span className="font-normal text-signal">
                video infrastructure
              </span>
              .
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-lg">
              Video hosting built for SaaS teams and startups. Upload,
              transcode, and stream with a lightweight SDK — with transparent
              pricing and no hidden playback or transcoding surprises.
            </p>

            {/* Capability Bullets */}
            <ul className="space-y-2.5 sm:space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-signal shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>

                <span>One SDK to upload, encode, and stream globally</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-signal shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Adaptive HLS playback optimized for performance</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-signal shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Built-in analytics, watermarking, and protection </span>
              </li>

              <li className="flex items-center gap-3">
                <svg
                  className="h-4 w-4 text-signal shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>
                  Transparent pricing — storage is yours, playback resets
                  monthly
                </span>
              </li>
            </ul>

            {/* CTAs - Professional & Restrained */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
              {/* Primary CTA - Solid, minimal */}
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-signal/50 focus:ring-offset-2 focus:ring-offset-background"
              >
                Start Free
              </Link>

              {/* Secondary CTA - Ghost style */}
              <Link
                href="/signin"
                className="inline-flex justify-center md:justify-start items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Column — Pipeline Console (visible at every viewport) */}
          <div className="relative flex items-center justify-center animate-fadeSlideIn animation-delay-200">
            <div className="pipeline-console group relative w-full max-w-lg corner-ticks graticule rounded-sm border border-hairline bg-card/60 p-5 sm:p-6">
              {/* Header — signal path readout */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Signal Path
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="tally-pulse h-1.5 w-1.5 rounded-full bg-signal"></span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-signal">
                    Live
                  </span>
                </span>
              </div>

              {/* Stages + ladder share one trace plane */}
              <div className="relative mt-6">
                {/* Stage rail */}
                <div className="grid grid-cols-3">
                  {["Ingest", "Transcode", "Deliver"].map((stage, i) => (
                    <div
                      key={stage}
                      className={`flex items-center gap-2 ${
                        i === 1 ? "justify-center" : ""
                      } ${i === 2 ? "justify-end" : ""}`}
                    >
                      <span className="h-1 w-1 shrink-0 bg-signal/70"></span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ladder label */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Rendition Ladder
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    HLS · Adaptive
                  </span>
                </div>

                {/* Ladder rows + trace overlay */}
                <div className="mt-3">
                  {[
                    { label: "360p", state: "ENCODED" },
                    { label: "480p", state: "ENCODED" },
                    { label: "720p", state: "ENCODED" },
                    { label: "1080p", state: "SKIPPED" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rendition-row flex items-center justify-between border-b border-hairline/60 py-2.5 last:border-b-0 transition-colors hover:bg-accent/40"
                    >
                      <span className="flex items-center gap-2.5 font-mono text-xs tracking-[0.12em] text-foreground/85">
                        <span
                          className={`h-1.5 w-1.5 ${
                            row.state === "ENCODED"
                              ? "bg-signal"
                              : "border border-hairline"
                          }`}
                        ></span>
                        {row.label}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                          row.state === "ENCODED"
                            ? "text-signal"
                            : "text-muted-foreground"
                        }`}
                      >
                        {row.state}
                      </span>
                    </div>
                  ))}

                  {/* Animated trace — scans stages, runs the ENCODED rungs */}
                  <svg
                    className="console-trace pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M2 12 H90 V46 H10 V62 V78"
                      stroke="var(--signal)"
                      strokeOpacity="0.7"
                      strokeWidth="0.5"
                      strokeLinecap="square"
                      className="trace-path"
                    />
                  </svg>
                </div>
              </div>

              {/* Footer — capability readout (no invented numbers) */}
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>360p–1080p ladder</span>
                <span className="text-signal/60">·</span>
                <span>HLS delivery</span>
                <span className="text-signal/60">·</span>
                <span>Free tier · 720p max</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;