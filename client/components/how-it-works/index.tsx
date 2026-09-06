import React from "react";

const stages = [
  {
    idx: "01",
    title: "Ingest",
    desc: "Upload once through the SDK. Videon takes the source file and prepares the full rendition ladder for playback.",
    readout: "SDK · Webhooks",
  },
  {
    idx: "02",
    title: "Transcode",
    desc: "Adaptive HLS renditions from 360p to 1080p are generated automatically — multi-bitrate, ready for every connection.",
    readout: "360p–1080p · HLS",
  },
  {
    idx: "03",
    title: "Deliver",
    desc: "Stream from edge servers worldwide with low latency and adaptive bitrate, protected by watermarking and OTP.",
    readout: "Edge · Watermark",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal mb-3">
            How It Works
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
            From upload to playback on one rail.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Three stages handle everything between your users&apos; source
            files and their playback buffer. No pipeline to manage.
          </p>
        </div>

        {/* Rail + modules */}
        <div className="relative">
          {/* connecting rail (desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px bg-hairline"
          >
            <span className="absolute -top-[3px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 bg-signal"></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stages.map((stage) => (
              <article
                key={stage.idx}
                className="relative rounded-sm border border-hairline bg-card/40 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
                    Stage {stage.idx}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {stage.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {stage.desc}
                </p>
                <div className="mt-5 border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  {stage.readout}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;