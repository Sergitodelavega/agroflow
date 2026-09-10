import { type ReactNode } from "react";
import { Link } from "react-router-dom";

function scrollToSection(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
}

export function DotCluster({ className = "size-[18px]" }: { className?: string }) {
  return (
    <span className={`grid grid-cols-3 gap-[2px] ${className}`} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className={`aspect-square rounded-full bg-current ${i === 4 ? "opacity-0" : ""}`}
        />
      ))}
    </span>
  );
}

export function LandingLink({
  to,
  children,
  variant = "fill",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: "fill" | "outline";
  className?: string;
}) {
  const kind = variant === "fill" ? "landing-btn-fill" : "landing-btn-outline";
  return (
    <Link to={to} className={`landing-btn ${kind} ${className}`}>
      {children}
    </Link>
  );
}

export function LandingAnchor({
  href,
  children,
  variant = "outline",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "fill" | "outline";
  className?: string;
}) {
  const kind = variant === "fill" ? "landing-btn-fill" : "landing-btn-outline";
  const section = href.startsWith("#") ? href.slice(1) : null;
  return (
    <a
      href={href}
      className={`landing-btn ${kind} ${className}`}
      onClick={
        section
          ? (event) => {
              event.preventDefault();
              scrollToSection(section);
            }
          : undefined
      }
    >
      {children}
    </a>
  );
}

export function SectionLink({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        scrollToSection(to);
      }}
    >
      {children}
    </a>
  );
}

export function ImageTile({
  src,
  alt,
  className,
  rotate = 0,
}: {
  src: string;
  alt: string;
  className: string;
  rotate?: number;
}) {
  return (
    <span
      data-landing-tile
      className={`pointer-events-none absolute ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="size-full rounded-[12px] object-cover"
        style={{ transform: `rotate(${rotate}deg)` }}
        aria-hidden={alt === "" ? true : undefined}
      />
    </span>
  );
}

export function FeatureCard({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <figure>
      <div className="overflow-hidden rounded-[16px]">
        <img src={src} alt={alt} className="aspect-[4/5] w-full object-cover" />
      </div>
      <figcaption className="landing-sub mt-4 text-ink-black">{label}</figcaption>
    </figure>
  );
}
