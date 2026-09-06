import React from "react";

const StorySection = () => {
  return (
    <section id="story" className="border-y border-hairline">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal mb-4">
          Why Videon Exists
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-snug mb-6">
          Video hosting shouldn&apos;t get more expensive — or more confusing —
          as you grow.
        </h2>

        <div className="space-y-4 text-[15px] text-muted-foreground leading-relaxed">
          <p>
            Most platforms make video easy at first — upload a file, copy an
            embed, it works. But once your product gains traction,{" "}
            <span className="text-foreground font-medium">everything changes</span>:
            playback multipliers, transcoding fees, storage tiers, and add-ons
            that should&apos;ve been included.
          </p>

          <p>
            Suddenly your monthly invoice feels harder to understand than{" "}
            <span className="text-foreground/85 font-medium">
              your own codebase
            </span>
            . For modern SaaS teams, video infrastructure shouldn&apos;t feel
            like a separate business model.
          </p>

          <p>It should be:</p>

          <ul className="space-y-2 pl-1">
            {[
              ["Predictable", "flat pricing that scales with you"],
              ["Transparent", "no hidden fees, ever"],
              ["Effortless", "scale without being punished for growth"],
            ].map(([bold, rest]) => (
              <li key={bold} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 bg-signal shrink-0" />
                <span>
                  <span className="text-foreground font-medium">{bold}</span>
                  <span className="text-muted-foreground/70"> — {rest}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-foreground font-medium pt-2">
            Videon is built to make video hosting simple, smart, and
            predictable.
          </p>
        </div>
      </div>
    </section>
  );
};

export default StorySection;