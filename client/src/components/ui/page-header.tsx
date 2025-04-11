import * as React from "react"

import { cn } from "@/lib/utils"

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-1", className)}
    {...props}
  >
    {children}
  </div>
))
PageHeader.displayName = "PageHeader"

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-2xl font-bold tracking-tight md:text-3xl",
      className
    )}
    {...props}
  />
))
PageHeaderHeading.displayName = "PageHeaderHeading"

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground", className)}
    {...props}
  />
))
PageHeaderDescription.displayName = "PageHeaderDescription"

export { PageHeader, PageHeaderHeading, PageHeaderDescription }