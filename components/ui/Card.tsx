interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingStyles = {
  none: "",
  sm: "p-5",
  md: "p-7",
  lg: "p-9",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={[
        "bg-white border border-border",
        paddingStyles[padding],
        hover
          ? "transition-all duration-300 ease-[var(--ease-elegant)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
