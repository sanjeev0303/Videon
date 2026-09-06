"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./common/logo";
import Image from "next/image";
import {
  HelpCircle,
  FolderKanban,
  AreaChart,
  CreditCard,
  Settings,
  PieChart,
  Sun,
  Menu,
  X,
  Video,
  PlaySquare,
  Sliders,
  Image as ImageIcon,
  FileText,
  LogOut,
  LifeBuoy,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";

/* Portal-based tooltip — escapes sidebar overflow-hidden */
function SidebarTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    }
    setVisible(true);
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            className="fixed px-2.5 py-1.5 rounded-sm bg-popover text-popover-foreground font-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap z-9999 shadow-lg border border-hairline pointer-events-none"
            style={{
              top: pos.top,
              left: pos.left,
              transform: "translateY(-50%)",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
}

const navSections = [
  {
    title: "General",
    links: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/dashboard/analytics", icon: AreaChart },
    ],
  },
  {
    title: "Video Management",
    links: [
      { title: "Upload Video", href: "/dashboard/uploads", icon: FolderKanban },
      { title: "My Videos", href: "/dashboard/my-videos", icon: Video },
      { title: "Playlists", href: "/dashboard/playlists", icon: PlaySquare },
    ],
  },
  {
    title: "Customization",
    links: [
      { title: "Player Settings", href: "/dashboard/player", icon: Sliders },
      { title: "Watermark & Branding", href: "/dashboard/branding", icon: ImageIcon },
    ],
  },
  {
    title: "Support",
    links: [
      { title: "Docs", href: "/dashboard/docs", icon: FileText },
      { title: "Support Center", href: "/dashboard/support", icon: LifeBuoy },
    ],
  },
  {
    title: "Account",
    links: [
      { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Log Out", href: "/logout", icon: LogOut },
    ],
  },
];

import { useAnalytics } from "@/hooks/useAnalytics";
import { useBilling } from "@/hooks/useBilling";

const Sidebar = () => {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const { analyticsQuery } = useAnalytics();
  const { currentPlan } = useBilling();
  const { data: globalAnalytics } = analyticsQuery;

  // resolvedTheme is undefined during SSR — default to "dark" to match defaultTheme
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;
  const toggleTheme = (): void => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleLogout = async () => {
    await signOut();
  };

  const iconClasses =
    "text-muted-foreground hover:text-foreground transition-colors";

  if (!isLoaded) return null;

  const usagePct = globalAnalytics?.overallUsagePct || 0;

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-sm bg-card border border-hairline text-foreground"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          fixed md:sticky top-0 left-0 z-40
          h-screen shrink-0
          ${collapsed ? "w-15" : "w-64"}
          flex flex-col
          overflow-hidden
          bg-card
          border-r border-hairline
          text-foreground
          transition-[width] duration-200 ease-in-out
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 pt-4 pb-2`}
        >
          {collapsed ? (
            <Link href="/dashboard" className="shrink-0 text-foreground" aria-label="Videon">
              <Logo iconOnly />
            </Link>
          ) : (
            <Link href="/dashboard" className="shrink-0 text-foreground">
              <Logo />
            </Link>
          )}

          <div
            className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2.5"}`}
          >
            {!collapsed && (
              <>
                <HelpCircle size={16} className={iconClasses} />
                <button onClick={() => toggleTheme()}>
                  {!isDark ? (
                    <Moon size={16} className={iconClasses} />
                  ) : (
                    <Sun size={16} className={iconClasses} />
                  )}
                </button>
              </>
            )}

            {/* Collapse toggle — desktop only */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>
        </div>

        {/* User info */}
        {!collapsed ? (
          <div className="flex items-center gap-3 mb-4 px-4 mt-2">
            <Image
              src={user?.imageUrl || "https://i.pravatar.cc/300"}
              alt="avatar"
              width={36}
              height={36}
              className="w-9 h-9 rounded-full border border-hairline shrink-0"
            />
            <div className="text-[13px] leading-4 min-w-0">
              <p className="font-semibold flex items-center gap-1">
                <span className="truncate max-w-24">
                  {user?.fullName?.split(" ")[0] ||
                    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
                    "User"}
                </span>
                <span className="px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] bg-signal/10 text-signal rounded-sm shrink-0">
                  {currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase() : "Free"}
                </span>
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center my-3">
            <Image
              src={user?.imageUrl || "https://i.pravatar.cc/300"}
              width={32}
              height={32}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-hairline"
            />
          </div>
        )}

        {/* Usage card */}
        {!collapsed && (
          <div className="mx-3 mb-4 px-3 py-3 rounded-sm bg-muted border border-hairline space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                <PieChart size={13} /> Usage
              </span>
              <span className="font-mono text-[11px] text-foreground">
                {usagePct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted-foreground/20 rounded-sm overflow-hidden">
              <div
                className="h-full bg-signal"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <Link
              href={"/dashboard/billing"}
              className="mt-1 cursor-pointer w-full font-mono text-[10px] uppercase tracking-[0.14em] text-signal hover:underline"
            >
              Manage Plan & Usage
            </Link>
          </div>
        )}

        {/* Navigation — scrollable */}
        <nav className="flex flex-col gap-4 px-2 flex-1 pb-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1">
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="border-t border-hairline my-1 mx-1" />
              )}
              <div className="flex flex-col gap-0.5">
                {section.links.map(({ title, href, icon: Icon }) => {
                  const link = (
                    <Link
                      key={href}
                      href={href === "/logout" ? "#" : href}
                      onClick={(e) => {
                        if (href === "/logout") {
                          e.preventDefault();
                          handleLogout();
                        }
                        setMobileOpen(false);
                      }}
                      className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} text-[14px] font-medium ${collapsed ? "px-2 py-2.5 mx-auto" : "px-4 py-2"} rounded-sm transition-colors ${
                        path === href
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{title}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <SidebarTooltip key={href} label={title}>
                        {link}
                      </SidebarTooltip>
                    );
                  }

                  return link;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom actions — collapsed mode */}
        {collapsed && (
          <div className="flex flex-col items-center gap-2 pb-4 pt-2 border-t border-hairline mt-auto mx-2">
            <SidebarTooltip label={isDark ? "Light mode" : "Dark mode"}>
              <button onClick={() => toggleTheme()} className={iconClasses}>
                {!isDark ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </SidebarTooltip>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;