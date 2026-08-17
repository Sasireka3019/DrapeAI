import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="eyebrow">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full bg-white border px-4 py-3 font-sans text-sm text-charcoal placeholder:text-slate",
            "transition-all duration-200 outline-none",
            "focus:border-charcoal focus:ring-0",
            error ? "border-red-400" : "border-border",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        {hint && !error && <p className="text-xs text-slate mt-0.5">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
