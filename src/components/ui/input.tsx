import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const hasError = error || ariaInvalid === true || ariaInvalid === "true"
    
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={error ? `${props.id || 'input'}-error` : undefined}
          {...props}
        />
        {error && (
          <div 
            id={`${props.id || 'input'}-error`}
            className="mt-1 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
