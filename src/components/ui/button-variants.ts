import { cva, type VariantProps } from "class-variance-authority";

/**
 * Tailwind class variants for `<Button>`. Kept in a components-free module so
 * that `src/components/ui/button.tsx` only exports the component itself —
 * React Fast Refresh preserves state across edits only when a file's exports
 * are all components, and the constant + type below would break that.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:brightness-110",
        outline:
          "border border-border bg-transparent text-fg hover:bg-card",
        ghost: "text-muted hover:bg-card hover:text-fg",
      },
      size: {
        default: "h-11 rounded-xl px-4 text-sm",
        sm: "h-10 min-h-10 rounded-lg px-3 text-xs",
        icon: "size-11 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
