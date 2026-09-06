import React from "react";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "For side projects and experiments.",
    features: [
      "5GB storage",
      "only HD (720p) streaming",
      "1,000 playback minutes / month",
      "720p resolution encoding",
      "API access",
      "Advanced analytics",
      "Videon watermark",
      "Email support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$14.99",
    desc: "For growing apps that need room.",
    features: [
      "250GB storage",
      "10,000 playback minutes / month",
      "Multi-bitrate adaptive streaming (360p–1080p)",
      "API access",
      "Advanced analytics",
      "Custom watermark",
      "Automatic Subtitle Generations",
      "Piracy protection",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29.99",
    desc: "For growing SaaS products.",
    badge: "Most Popular",
    features: [
      "600GB storage",
      "22,000 playback minutes / month",
      "Multi-bitrate adaptive streaming (360p–1080p)",
      "API access",
      "Advanced analytics",
      "Custom watermark",
      "Automatic Subtitle Generations",
      "Piracy protection",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$69.99",
    desc: "For high-volume video platforms.",
    features: [
      "2TB storage",
      "50,000 playback minutes / month",
      "Multi-bitrate adaptive streaming (360p–1080p)",
      "API access",
      "Advanced analytics",
      "Custom watermark",
      "Automatic Subtitle Generations",
      "Piracy protection",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section
      id="pricing"
      className="rate-card scroll-mt-16 py-16 sm:py-24 overflow-hidden border-y border-ink/10 bg-paper text-ink"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/60 mb-3">
            Pricing
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-3">
            Simple. Predictable. Transparent.
          </h2>
          <p className="text-sm sm:text-base text-ink/60">
            Storage stays. Playback minutes reset every billing cycle.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-sm p-6 flex flex-col transition-colors border ${
                plan.highlighted
                  ? "border-ink/30 bg-white shadow-[0_0_24px_-8px_rgba(20,24,22,0.25)]"
                  : "border-ink/12 bg-paper hover:border-ink/25"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-ink text-paper font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div
                  className={`font-mono text-[10px] uppercase tracking-[0.22em] mb-2 ${
                    plan.highlighted ? "text-signal" : "text-ink/50"
                  }`}
                >
                  {plan.name}
                </div>
                <div className="font-mono text-3xl font-semibold text-ink tracking-tight">
                  {plan.price}
                  <span className="font-sans text-sm text-ink/50 font-normal">
                    {" "}
                    / month
                  </span>
                </div>
                <p className="text-sm text-ink/60 mt-1.5">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => {
                  const storageMatch = feature.match(
                    /^(\d+(?:\.\d+)?)\s*(GB|TB)\s+storage$/i,
                  );

                  return (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-ink/70 group"
                    >
                      <Check
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-signal" : "text-ink/35"
                        }`}
                        strokeWidth={2}
                      />
                      <span className="flex-1 flex items-center gap-1.5 flex-wrap">
                        {feature}
                        {storageMatch && (
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-ink/40 hover:text-ink/70 transition-colors cursor-pointer opacity-70 hover:opacity-100" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-70 p-4 rounded-sm bg-popover border border-hairline text-popover-foreground shadow-xl"
                            >
                              <div className="space-y-2">
                                <p className="font-semibold text-foreground text-sm">
                                  Estimated Capacity
                                </p>
                                <p className="text-muted-foreground text-xs leading-relaxed">
                                  Based on this{" "}
                                  <span className="text-foreground font-medium">
                                    {storageMatch[0]}
                                  </span>{" "}
                                  limit, you can upload and process
                                  approximately{" "}
                                  <span className="text-signal font-medium">
                                    {plan.name === "Free"
                                      ? "30"
                                      : Math.round(
                                          parseFloat(storageMatch[1]) *
                                            (storageMatch[2].toUpperCase() ===
                                              "TB"
                                              ? 1024
                                              : 1) *
                                            3,
                                        ).toLocaleString()}{" "}
                                    minutes
                                  </span>{" "}
                                  of HD video content.
                                </p>
                                {plan.name !== "Free" && (
                                  <p className="text-muted-foreground/70 text-[10px] leading-relaxed italic border-t border-hairline pt-2 mt-2">
                                    This is an estimated capacity based on
                                    adaptive streaming (master file + 360p,
                                    480p, 720p, and 1080p renditions). Actual
                                    capacity may vary depending on your source
                                    bitrate and selected output resolutions.
                                  </p>
                                )}
                                {plan.name === "Free" && (
                                  <p className="text-muted-foreground/70 text-[10px] leading-relaxed italic border-t border-hairline pt-2 mt-2">
                                    This is an estimated capacity based on
                                    adaptive streaming (master file + 720p
                                    encoding). Actual capacity may vary
                                    depending on your source bitrate.
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="#get-started"
                className={`w-full py-2.5 rounded-sm font-mono text-xs uppercase tracking-[0.18em] text-center transition-colors ${
                  plan.highlighted
                    ? "bg-ink text-paper hover:bg-ink/85"
                    : "border border-ink/15 text-ink/80 hover:border-ink/30 hover:text-ink"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Microcopy */}
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink/45 font-semibold">
          Storage is persistent and does not reset. Playback minutes reset
          monthly with your billing cycle.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;