import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section
      id="get-started"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* hairline field */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-hairline"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal mb-4">
          Sign Off
        </div>
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl mb-6">
          Ready to streamline your video workflow?
        </h2>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground mb-10">
          Join thousands of developers building the next generation of video
          applications with Videon. Start for free, upgrade as you grow.
        </p>

        <div className="flex items-center justify-center gap-x-6">
          <Link
            href="/signup"
            className="rounded-sm bg-primary px-8 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Create account
          </Link>
          <Link
            href="/signin"
            className="group text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            Sign in{" "}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}