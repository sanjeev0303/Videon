import {
  Eye,
  FileJson,
  Globe,
  Search,
  Subtitles,
  Zap,
} from "lucide-react";
import React from "react";

const features = [
  {
    icon: Zap,
    title: "Upload & Transcode",
    desc: "Upload once. Videon handles encoding, adaptive HLS, and optimization for fast global playback.",
  },
  {
    icon: Search,
    title: "Customizable Player",
    desc: "Match your brand. Control UI, colors, watermark, and playback behavior.",
  },
  {
    icon: Eye,
    title: "Advanced Analytics",
    desc: "Understand watch time, drop-offs, viewer engagement, and performance trends.",
  },
  {
    icon: FileJson,
    title: "Built-in Protection",
    desc: "Custom watermark, piracy protection, OTP security — no extra setup.",
  },
  {
    icon: Globe,
    title: "Global CDN Delivery",
    desc: "Stream from edge servers worldwide with low latency and adaptive bitrate.",
  },
  {
    icon: Subtitles,
    title: "AI-Powered Captions",
    desc: "Auto-generate accurate subtitles and transcriptions for every video.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal mb-3">
            Features
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Powerful video infrastructure without the infrastructure overhead.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="group relative rounded-sm border border-hairline bg-card/40 p-6 transition-colors hover:border-signal/40 hover:bg-card/70"
            >
              <span className="absolute top-5 right-5 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 select-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mb-4 flex items-center justify-center h-9 w-9 rounded-sm border border-hairline text-signal">
                <f.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1.5">
                {f.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;