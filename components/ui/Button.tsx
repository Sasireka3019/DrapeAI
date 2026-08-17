import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-charcoal text-white border border-charcoal hover:bg-charcoal-soft hover:border-charcoal-soft active:scale-[0.98]",
  secondary:
    "bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-white active:scale-[0.98]",
  ghost:
    "bg-transparent text-charcoal border border-transparent hover:border-border active:scale-[0.98]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-5 py-2.5 text-xs tracking-widest",
  md: "px-8 py-3.5 text-xs tracking-widest",
  lg: "px-10 py-4 text-sm tracking-widest",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading = false, className = "", children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center gap-2 font-sans font-medium uppercase",
          "transition-all duration-300 ease-[var(--ease-elegant)] cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Processing</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
