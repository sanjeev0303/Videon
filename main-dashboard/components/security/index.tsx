import { useState } from "react";
import { ChevronRight, CircleUser, ShieldCheck } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { Button } from "@/components/ui/button";

const SecuritySection = () => {
  const { resolvedTheme } = useTheme();
  const [openSection, setOpenSection] = useState<null | "manage" | "domains">(
    null,
  );

  const toggleSection = (section: any) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="md:w-[60%] space-y-2">
      {/* Update Password */}
      <div>
        <div
          className="flex items-center justify-between px-3 py-3 cursor-pointer"
          onClick={() => toggleSection("manage")}
        >
          <div className="flex items-start gap-3">
            <CircleUser size={22} className="text-signal mt-1" />
            <div>
              <div className="text-base font-medium">Manage Account</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Change your current account password.
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`text-muted-foreground transition-transform ${openSection === "manage" ? "rotate-90" : ""
              }`}
          />
        </div>
      </div>

      {/* Whitelisted Domains */}
      <div>
        <div
          className="flex items-center justify-between px-3 py-3 cursor-pointer"
          onClick={() => toggleSection("domains")}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="text-signal mt-1" />
            <div>
              <div className="text-base font-medium">Whitelisted Domains</div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Only allow video plays from specific domains to prevent
                unauthorized access.
              </p>
            </div>
          </div>
          <ChevronRight
            size={16}
            className={`text-muted-foreground transition-transform ${openSection === "domains" ? "rotate-90" : ""
              }`}
          />
        </div>

        {openSection === "manage" && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={() => setOpenSection(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <UserProfile
                appearance={{
                  baseTheme: resolvedTheme === "dark" ? dark : undefined,
                  elements: {
                    card: "shadow-xl border border-hairline",
                    navbar: "hidden",
                    navbarMobileMenuButton: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  }
                }}
              />
            </div>
          </div>
        )}

        {openSection === "domains" && (
          <div className="border-t border-hairline px-4 py-4 space-y-4">
            <input
              type="text"
              placeholder="e.g. mywebsite.com"
              className="w-full px-3 py-2 rounded-sm bg-card border border-hairline text-sm"
            />
            <Button variant="default" className="cursor-pointer text-sm" type="button">
              Add Domain
            </Button>

            {/* Placeholder for domain list */}
            <div className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center border border-hairline px-3 py-2 rounded-sm">
                <span className="text-foreground">example.com</span>
                <button className="text-destructive cursor-pointer hover:underline text-xs">
                  Remove
                </button>
              </div>
              <div className="flex justify-between items-center border border-hairline px-3 py-2 rounded-sm">
                <span className="text-foreground">videon.dev</span>
                <button className="text-destructive hover:underline cursor-pointer text-xs">
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySection;
