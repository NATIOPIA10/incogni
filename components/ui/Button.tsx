import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00D1FF] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#2E004B] text-white hover:shadow-[0_0_15px_rgba(0,209,255,0.5)]": variant === "primary",
            "bg-transparent border border-white/20 text-white hover:bg-white/10": variant === "secondary",
            "hover:bg-white/10 text-white": variant === "ghost",
            "h-12 px-6 py-2 text-base": size === "default",
            "h-9 rounded-full px-4": size === "sm",
            "h-14 rounded-full px-8 text-lg": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
