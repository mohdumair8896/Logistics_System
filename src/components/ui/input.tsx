import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-3.5 py-2 text-xs transition-colors",
          "placeholder:text-[var(--text-xlow)] text-[var(--text-high)]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--brand)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-[var(--destructive)] aria-invalid:ring-[var(--destructive)]/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
