"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import SecuritySection from "@/components/security";
import { useUser } from "@clerk/nextjs";
import GeneralTab from "./_components/general-tab";
import DeveloperAccessTab from "./_components/developer-access-tab";
import { useApiKeys } from "@/hooks/useApiKeys";

const tabs = ["General", "Developer Access", "Security"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const { user, isLoaded } = useUser();
  // Call useApiKeys to trigger background fetching as soon as the settings page loads
  useApiKeys();

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">
          Settings
        </span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-6">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Manage your account preferences, access control, and security options.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-hairline mb-6">
        <div className="flex gap-6 text-sm font-medium">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 transition cursor-pointer ${
                activeTab === tab
                  ? "border-b-2 border-signal text-signal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "General" && <GeneralTab userEmail={user?.emailAddresses[0]?.emailAddress} />}
        {activeTab === "Developer Access" && <DeveloperAccessTab />}
        {activeTab === "Security" && <SecuritySection />}
      </div>
    </div>
  );
}