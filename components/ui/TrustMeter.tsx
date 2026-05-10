import * as React from "react"
import { cn } from "@/lib/utils"

export interface TrustMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  level: number // 0 to 100
}

const TrustMeter = React.forwardRef<HTMLDivElement, TrustMeterProps>(
  ({ className, level, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const threshold = (i + 1) * 20
          const isActive = level >= threshold
          return (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-500",
                isActive
                  ? "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "bg-white/10"
              )}
            />
          )
        })}
      </div>
    )
  }
)
TrustMeter.displayName = "TrustMeter"

export { TrustMeter }
