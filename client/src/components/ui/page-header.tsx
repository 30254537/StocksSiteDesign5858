import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PageHeader({
  className,
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("grid gap-1 pb-4", className)} {...props}>
      {children}
    </div>
  )
}

interface PageHeaderHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function PageHeaderHeading({
  className,
  children,
  ...props
}: PageHeaderHeadingProps) {
  return (
    <h1
      className={cn(
        "text-2xl font-bold tracking-tight text-primary md:text-3xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function PageHeaderDescription({
  className,
  children,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
}