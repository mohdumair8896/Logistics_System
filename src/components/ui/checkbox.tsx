"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked: controlledChecked, defaultChecked, onCheckedChange, disabled, id, name, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked ?? false)
    const isChecked = controlledChecked !== undefined ? controlledChecked : uncontrolledChecked

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      if (disabled) return
      const nextChecked = !isChecked
      if (controlledChecked === undefined) {
        setUncontrolledChecked(nextChecked)
      }
      onCheckedChange?.(nextChecked)
    }

    return (
      <button
        type="button"
        role="checkbox"
        id={id}
        name={name}
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "peer h-4.5 w-4.5 shrink-0 rounded-md border-[1.5px] border-[var(--border-mid)] bg-[var(--surface-1)] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-[var(--brand)] data-[state=checked]:border-[var(--brand)] data-[state=checked]:text-white shadow-xs",
          "aria-invalid:border-[var(--status-error)] aria-invalid:ring-[var(--status-error)]/20",
          "inline-flex items-center justify-center cursor-pointer select-none",
          className
        )}
        {...props}
      >
        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
