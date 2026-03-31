import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(15,118,110,0.18)] hover:bg-primary/92 hover:shadow-[0_16px_30px_rgba(15,118,110,0.22)]",
        outline:
          "border border-border bg-white/82 text-foreground shadow-[0_8px_18px_rgba(23,23,23,0.04)] hover:bg-white",
        secondary:
          "bg-muted/90 text-foreground shadow-[0_8px_18px_rgba(23,23,23,0.04)] hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_24px_rgba(185,28,28,0.16)] hover:bg-destructive/92",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 rounded-2xl px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
