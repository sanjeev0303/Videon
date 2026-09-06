"use client";
import * as React from "react";
import Logo from "./logo";

/**
 * Legacy name kept for callers that pick a tone explicitly.
 * The lockup is theme-adaptive (currentColor), so this is the same
 * component — tone comes from the surrounding text color.
 */
const LogoLight = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <Logo ref={ref} {...props} />,
);

LogoLight.displayName = "LogoLight";

export default LogoLight;