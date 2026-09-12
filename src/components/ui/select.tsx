"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (val: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select provider")
  }
  return context
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value: controlledValue, defaultValue = "", onValueChange, children }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (val: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(val)
      }
      onValueChange?.(val)
      setOpen(false)
    },
    [controlledValue, onValueChange]
  )

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div ref={selectRef} className="relative inline-block text-left">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = useSelect()
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      className={cn(
        "flex h-9.5 min-w-[152px] items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] px-4 py-2 text-xs font-semibold text-[var(--text-high)] shadow-xs transition-all hover:bg-[var(--surface-2)] hover:border-[var(--border-mid)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] cursor-pointer select-none",
        open && "border-[var(--brand)] ring-2 ring-[var(--brand)]/15",
        className
      )}
      {...props}
    >
      <div className="flex items-center min-w-0 flex-1 truncate text-left pr-1">
        {children}
      </div>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-[var(--text-low)] transition-transform duration-200",
          open && "rotate-180 text-[var(--brand)]"
        )}
      />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

export function SelectValue({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) {
  const { value } = useSelect()
  if (children) return <span className="truncate">{children}</span>
  return <span className="truncate">{value ? value : placeholder}</span>
}

export function SelectContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { open } = useSelect()
  if (!open) return null

  return (
    <div
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] z-50 min-w-[164px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 text-[var(--text-high)] shadow-xl animate-in fade-in-80 zoom-in-95",
        className
      )}
    >
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

export function SelectItem({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const { value: selectedValue, onValueChange } = useSelect()
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3.5 py-2 text-xs font-medium outline-none transition-colors hover:bg-[var(--surface-2)] text-[var(--text-high)]",
        isSelected && "bg-[var(--brand)]/8 font-semibold text-[var(--brand)] hover:bg-[var(--brand)]/12",
        className
      )}
    >
      <span className="truncate text-left flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--brand)] ml-2" />}
    </button>
  )
}

