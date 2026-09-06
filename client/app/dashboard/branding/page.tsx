"use client";

import { Eye, EyeOff, Crown, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/common/logo";
import LogoLight from "@/components/common/logolight";
import { useBranding } from "@/hooks/useBranding";

const Page = () => {
  const { settings, isLoading, isSaving, updateSettings, uploadWatermark, error, uploadError } = useBranding();

  const isProUser = settings?.canCustomize ?? false;

  const [enabled, setEnabled] = useState(true);
  const [position, setPosition] = useState("bottom-right");
  const [opacity, setOpacity] = useState(50);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setPosition(settings.position);
      setOpacity(settings.opacity);
    }
  }, [settings]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">Loading...</div>;
  }

  const handleSave = async () => {
    if (!isProUser) return;
    
    if (file) {
      const success = await uploadWatermark(file);
      if (success) {
        setFile(null);
      } else {
        return;
      }
    }
    
    await updateSettings({ enabled, position: position as any, opacity });
  };

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight className="mx-2 opacity-60" size={14} />
        <span className="text-foreground font-medium">
          Watermark & Branding
        </span>
      </nav>

      {/* Header */}
      <div className="space-y-1 mb-8">
        <h1 className="font-display text-2xl font-semibold">Watermark & Branding</h1>
        <p className="text-sm text-muted-foreground max-w-125">
          Personalize your videos by uploading a custom watermark and
          configuring its appearance.
        </p>
      </div>

      <div className="bg-card rounded-sm p-6 border border-hairline max-w-3xl space-y-6">
        {/* Enable/Disable */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold">Watermark Visibility</h3>
            <p className="text-xs text-muted-foreground">
              The Videon watermark will be applied by default for free users.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            disabled={!isProUser}
            className={`px-3 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
              enabled
                ? "bg-signal text-signal-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {enabled ? <Eye size={16} /> : <EyeOff size={16} />}
            {enabled ? "On" : "Off"}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-muted/40 border border-hairline p-4 rounded-sm flex items-center justify-between">
          <div className="text-sm text-foreground font-medium">
            {isProUser
              ? "Current Watermark Preview"
              : "Videon Watermark (Default)"}
          </div>
          {isProUser && (settings?.fileKey || file) ? (
            <img
              src={file ? URL.createObjectURL(file) : (settings?.fileKey?.startsWith('http') ? settings.fileKey : `https://videon-bucket.s3.ap-south-1.amazonaws.com/${settings?.fileKey}`)}
              alt="Watermark Preview"
              className="max-w-[100px] max-h-[50px] object-contain"
              style={{ opacity: opacity / 100 }}
            />
          ) : (
            <>
              <div className="dark:hidden md:w-25 inline-block" style={{ opacity: opacity / 100 }}>
                <LogoLight />
              </div>
              <div className="hidden md:w-25 dark:inline-block" style={{ opacity: opacity / 100 }}>
                <Logo />
              </div>
            </>
          )}
        </div>

        {/* Pro-only settings */}
        <div
          className={`space-y-5 transition-opacity ${
            isProUser ? "opacity-100" : "opacity-50 pointer-events-none"
          }`}
        >
          {/* Upload */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Upload Custom Watermark
            </label>
            <input
              type="file"
              accept="image/png,image/svg+xml"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block text-sm text-muted-foreground"
            />
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Watermark Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-muted/40 border border-input rounded-sm px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="center">Center</option>
            </select>
          </div>

          {/* Opacity */}
          <div>
            <label className="text-sm font-medium block mb-1">
              Opacity: {opacity}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-signal"
            />
          </div>
        </div>

        {/* Pro Prompt */}
        {!isProUser && (
          <div className="bg-signal/5 border border-signal/20 text-signal p-4 rounded-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Crown size={16} />
              Upgrade to Pro to customize your watermark and branding.
            </div>
            <button className="text-sm font-semibold text-signal cursor-pointer hover:underline">
              Upgrade
            </button>
          </div>
        )}

        {/* Save Button */}
        {isProUser && (
          <div className="flex justify-end items-center gap-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            {uploadError && <p className="text-destructive text-sm">{uploadError}</p>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-sm rounded-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium transition"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;