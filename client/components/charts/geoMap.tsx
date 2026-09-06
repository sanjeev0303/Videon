"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const SIGNAL_DARK = "#3BE39F";
const SIGNAL_LIGHT = "#15875A";

interface GeographicalMapProps {
  data?: { country: string; views: number }[];
}

const GeographicalMap: React.FC<GeographicalMapProps> = ({ data = [] }) => {
  const [hovered, setHovered] = useState<{
    name: string;
    visitors: number;
  } | null>(null);

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme ? resolvedTheme === "dark" : true;
  // Only saturated accent is signal; absence reads as quiet ink, never slate/blue.
  const signal = isDark ? SIGNAL_DARK : SIGNAL_LIGHT;
  const inkQuiet = isDark ? "oklch(0.32 0.012 85 / 0.55)" : "oklch(0.50 0.02 85 / 0.30)";
  const inkActive = isDark ? "oklch(0.42 0.014 85 / 0.75)" : "oklch(0.50 0.02 85 / 0.55)";
  const hairline = isDark ? "oklch(1 0 0 / 0.10)" : "oklch(0.12 0.01 85 / 0.12)";

  const getCountryNameFromCode = (code: string) => {
    try {
      const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
      if (name === "United States") return "United States of America";
      return name || code;
    } catch {
      return code;
    }
  };

  const findMatch = (countryName: string) =>
    data.find(
      (c) =>
        getCountryNameFromCode(c.country) === countryName ||
        c.country === countryName
    );

  return (
    <div className="relative w-full -ml-[5%] px-0 py-5 overflow-visible">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 230, center: [0, 10] }}
        width={1400}
        height={500}
        viewBox="0 0 1400 500"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: "100%",
          height: "35vh",
          background: "transparent",
          margin: 0,
          padding: 0,
          display: "block",
        }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const match = findMatch(countryName);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    setTooltipPosition({ x: e.pageX, y: e.pageY });
                    setHovered({
                      name: countryName,
                      visitors: match?.views || 0,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltipPosition({ x: e.pageX, y: e.pageY });
                  }}
                  onMouseLeave={() => setHovered(null)}
                  fill={match ? signal : inkQuiet}
                  stroke={hairline}
                  style={{
                    default: {
                      outline: "none",
                      transition: "fill 0.3s ease-in-out",
                    },
                    hover: {
                      fill: match ? signal : inkActive,
                      outline: "none",
                      transition: "fill 0.3s ease-in-out",
                    },
                    pressed: {
                      fill: match ? signal : inkActive,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip with animation */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed bg-popover text-popover-foreground text-xs p-2 rounded-sm border border-hairline shadow-lg pointer-events-none z-9999"
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
            }}
          >
            <strong>{hovered.name}</strong>
            <br />
            Visitors: <span className="text-signal">{hovered.visitors}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeographicalMap;