"use client";

import {
  Check,
  ChevronRight,
  ImageIcon,
  Play,
  PlayCircle,
  PlaySquare,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { usePlayerSettings, PlayerSettings } from "@/hooks/usePlayerSettings";
import { useEffect } from "react";

const fonts = ["Rubik", "Inter", "Poppins"];
const controls = [
  "Play / Pause",
  "10s Backward",
  "10s Forward",
  "Full Screen",
  "Captions",
  "Volume",
  "Mute",
  "Progress",
  "Settings",
  "AirPlay",
  "Chromecast",
  "Current Time",
  "Duration",
];

// Swatches are the *player's* configurable accent — the app chrome stays
// single-accent (signal); the brand default leads the offering.
const presetColors = [
  "#3BE39F",
  "#15875A",
  "#3b82f6",
  "#2563eb",
  "#06b6d4",
  "#10b981",
  "#facc15",
  "#f97316",
  "#f87171",
  "#fb7185",
  "#c084fc",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#64748b",
  "#6b7280",
  "#1e293b",
  "#fbbf24",
  "#e2e8f0",
  "#e5e7eb",
  "#ff7755",
];

export default function PlayerSettingsPage() {
  const { settings, isLoading, isSaving, updateSettings, error } = usePlayerSettings();

  const [selectedLanguage, setSelectedLanguage] = useState("English (en)");
  const [selectedFont, setSelectedFont] = useState("Rubik");
  const [fontColor, setFontColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(18);
  const [primaryColor, setPrimaryColor] = useState("#3BE39F");
  const [enabledControls, setEnabledControls] = useState<string[]>(controls);
  const [useCustomIcon, setUseCustomIcon] = useState(false);
  const [selectedPlayIcon, setSelectedPlayIcon] = useState("Classic");
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      if (settings.fontFamily) setSelectedFont(settings.fontFamily);
      if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
      if (settings.controls) setEnabledControls(settings.controls);
      if (settings.captions) {
        if (settings.captions.fontColor) setFontColor(settings.captions.fontColor);
        if (settings.captions.backgroundColor) setBgColor(settings.captions.backgroundColor);
        if (settings.captions.fontSize) setFontSize(settings.captions.fontSize);
      }
      if (settings.playButton) {
        if (settings.playButton.preset) {
          const p = settings.playButton.preset;
          setSelectedPlayIcon(p.charAt(0).toUpperCase() + p.slice(1));
        }
        if (settings.playButton.customIcon) {
          setUseCustomIcon(true);
        }
      }
    }
  }, [settings]);

  const toggleControl = (control: string) => {
    setEnabledControls((prev) =>
      prev.includes(control)
        ? prev.filter((c) => c !== control)
        : [...prev, control],
    );
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    let customIcon = settings?.playButton?.customIcon;

    if (useCustomIcon && customIconFile) {
      customIcon = await getBase64(customIconFile);
    }

    const newSettings: PlayerSettings = {
      primaryColor,
      fontFamily: selectedFont,
      controls: enabledControls,
      captions: {
        fontColor,
        backgroundColor: bgColor,
        fontSize,
      },
      playButton: {
        preset: selectedPlayIcon.toLowerCase() as 'classic' | 'minimal' | 'block',
        ...(useCustomIcon && customIcon ? { customIcon } : {}),
      },
    };
    await updateSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="text-foreground flex items-center justify-center h-full min-h-[500px] font-mono text-sm text-muted-foreground">
        Loading Settings...
      </div>
    );
  }

  const selectClasses =
    "flex h-9 w-full rounded-sm border border-input bg-muted/40 px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50";
  const inputClasses =
    "w-full min-w-0 rounded-sm border border-input bg-muted/40 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">Player Settings</span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-8">
        <h1 className="font-display text-2xl font-semibold">Player Settings</h1>
        <p className="text-sm text-muted-foreground max-w-[500px]">
          Customize your video player&apos;s appearance and behavior for a seamless
          brand experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Language */}
        <div className="bg-card rounded-sm p-5 border border-hairline">
          <label className="text-sm font-medium text-foreground mb-1 block">
            Player UI Language
          </label>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {selectedLanguage}
          </p>
        </div>

        {/* Player Font */}
        <div className="bg-card rounded-sm p-5 border border-hairline">
          <label className="text-sm font-medium text-foreground mb-1 block">
            Font Family
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Select the font family that will be used in the video player.
          </p>
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className={selectClasses}
          >
            {fonts.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Primary Colors */}
        <div className="bg-card rounded-sm p-5 border border-hairline">
          <label className="text-sm font-medium text-foreground mb-1 block">
            Primary Player Colors
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Primary color will be displayed for the controls.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => setPrimaryColor(color)}
                className={`w-6 h-6 rounded-sm transition-all ${
                  primaryColor === color
                    ? "ring-2 ring-signal ring-offset-1 ring-offset-card"
                    : "ring-1 ring-hairline hover:ring-muted-foreground/50"
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
          <div className="flex mt-2 items-center gap-2">
            {/* Custom trigger */}
            <label
              htmlFor="color-input"
              className="w-8 h-8 rounded-sm cursor-pointer border-2 border-hairline"
              style={{ backgroundColor: primaryColor }}
            />

            {/* Hidden native color input */}
            <input
              id="color-input"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="sr-only"
            />

            {/* HEX code input */}
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className={`w-24 font-mono text-xs ${inputClasses}`}
            />
          </div>
        </div>

        {/* Captions Appearance */}
        <div className="bg-card rounded-sm p-5 border border-hairline">
          <label className="text-sm font-medium text-foreground mb-1 block">
            Captions Appearance
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Configure the captions appearance.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Font Color</label>
              <input
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Background Color</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-foreground">Font Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-20 font-mono text-xs px-2 py-1 rounded-sm border border-input bg-muted/40 text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="md:flex w-full justify-between flex-wrap">
        <div className="md:w-[49%] bg-card rounded-sm p-5 border border-hairline mt-10">
          <h3 className="text-sm font-medium text-foreground mb-2">Play Button Icon</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Personalize your video player&apos;s play button. Use a preset or
            upload your own SVG/logo.
          </p>

          {/* Toggle Preset vs Upload */}
          <div className="inline-flex rounded-sm bg-muted p-1 mb-4">
            <button
              onClick={() => setUseCustomIcon(false)}
              className={`text-sm px-4 py-1.5 rounded-sm transition-all ${
                !useCustomIcon
                  ? "bg-card text-foreground font-semibold shadow-xs border border-hairline"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Preset Icons
            </button>
            <button
              onClick={() => setUseCustomIcon(true)}
              className={`text-sm px-4 py-1.5 rounded-sm transition-all ${
                useCustomIcon
                  ? "bg-card text-foreground font-semibold shadow-xs border border-hairline"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload SVG/Image
            </button>
          </div>

          {/* Preset Options */}
          {!useCustomIcon && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Classic", icon: <PlayCircle size={20} /> },
                { label: "Minimal", icon: <Play size={20} /> },
                { label: "Block", icon: <PlaySquare size={20} /> },
              ].map(({ label, icon }) => (
                <button
                  key={label}
                  onClick={() => setSelectedPlayIcon(label)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-sm border transition-all ${
                    selectedPlayIcon === label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/40 border-hairline text-foreground hover:bg-muted"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Upload */}
          {useCustomIcon && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <UploadCloud size={16} />
                Upload SVG or transparent PNG
              </label>
              <input
                type="file"
                accept="image/svg+xml,image/png"
                onChange={(e) => setCustomIconFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-2 file:cursor-pointer file:rounded-sm file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
              />
              {(customIconFile || settings?.playButton?.customIcon) && (
                <div className="mt-3 flex items-center gap-3">
                  <ImageIcon
                    size={20}
                    className="text-muted-foreground"
                  />
                  <img
                    src={customIconFile ? URL.createObjectURL(customIconFile) : settings?.playButton?.customIcon}
                    alt="Custom Play Icon"
                    className="w-10 h-10 object-contain border border-hairline rounded-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player Controls */}
        <div className="md:w-[49%] mt-10 bg-card rounded-sm p-5 border border-hairline">
          <label className="text-sm font-medium text-foreground mb-1 block">
            Player Controls
          </label>
          <p className="text-xs text-muted-foreground mb-4">
            Select the UI controls that will be displayed on the player.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {controls.map((control) => (
              <button
                key={control}
                onClick={() => toggleControl(control)}
                className={`px-3 flex items-center gap-1.5 py-2 text-sm rounded-sm border transition-all ${
                  enabledControls.includes(control)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-hairline hover:text-foreground"
                }`}
              >
                {enabledControls.includes(control) ? (
                  <Check size={14} className="shrink-0 text-primary-foreground" />
                ) : (
                  <X size={14} className="shrink-0 text-muted-foreground" />
                )}
                {control}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="w-full flex justify-end items-center mt-8">
        {error && (
          <div className="text-destructive text-sm mr-4 self-center">{error}</div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 transition text-primary-foreground rounded-sm text-sm font-semibold"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}