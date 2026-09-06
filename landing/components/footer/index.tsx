import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import Logo from "@/components/logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="lg:col-span-1">
            <Link href="#" className="flex items-center gap-1 text-foreground">
              <Logo />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              The developer platform for <br /> video production workloads.
            </p>
          </div>

          <div className="flex gap-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Link
              href="/docs"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://x.com/motionmesh"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="https://github.com/sanjeev0303/videon"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://status.videon.com"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              Status
            </Link>
          </div>
          <Link
            href={"https://status.videon.com"}
            target="_blank"
            className="flex items-center gap-2"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex h-2 w-2 cursor-pointer">
                    <span className="tally-pulse absolute inline-flex h-full w-full rounded-full bg-signal"></span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Live</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              All systems are operational now
            </span>
          </Link>
        </div>

        <div className="mt-8 border-t border-hairline pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[0.7rem] text-muted-foreground/70">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div>© {currentYear} Motionmesh Inc.</div>
            <div className="hidden sm:block text-muted-foreground/30">•</div>
            <div className="flex items-center gap-1">
              Built with <span className="text-destructive mx-1">❤️</span> for
              developers
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}