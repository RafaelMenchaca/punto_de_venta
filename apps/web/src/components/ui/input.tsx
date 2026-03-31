import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, onWheel, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-white/86 px-3.5 py-2 text-sm shadow-[0_6px_18px_rgba(23,23,23,0.05)] outline-none transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-ring/70",
          className,
        )}
        ref={ref}
        onWheel={(event) => {
          if (
            type === "number" &&
            event.currentTarget === document.activeElement
          ) {
            event.currentTarget.blur();
          }

          onWheel?.(event);
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
