import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  /** Show the "Find My Look" CTA. Hide on pages that are already in the flow. */
  showCta?: boolean;
}

export function Header({ showCta = true }: HeaderProps) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: "rgba(250,248,245,0.92)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "72rem",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "clamp(1.5rem,4vw,4rem)",
        paddingRight: "clamp(1.5rem,4vw,4rem)",
        height: "4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link
          href="/"
          className="font-serif"
          style={{ fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--color-charcoal)", textDecoration: "none" }}
        >
          Drape
        </Link>

        {showCta && (
          <Link href="/onboarding">
            <Button variant="primary" size="sm">
              Find My Look
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
