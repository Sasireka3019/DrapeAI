interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-block px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase",
        "border border-border text-slate bg-ivory",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
