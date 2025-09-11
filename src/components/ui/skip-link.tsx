import * as React from "react"
import { cn } from "@/lib/utils"

const SkipLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a">
>(({ className, href = "#main-content", children = "Skip to main content", ...props }, ref) => (
  <a
    ref={ref}
    href={href}
    className={cn(
      "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-[9999]",
      "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium",
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
  </a>
))
SkipLink.displayName = "SkipLink"

export { SkipLink }