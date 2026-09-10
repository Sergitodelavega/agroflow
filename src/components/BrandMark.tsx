const MARKS = {
  black: "/logo_A_full_black.png",
  white: "/logo_A_full_white.png",
} as const;

export default function BrandMark({
  variant = "black",
  className = "size-8",
  decorative = false,
}: {
  variant?: "black" | "white";
  className?: string;
  decorative?: boolean;
}) {
  return (
    <img
      src={MARKS[variant]}
      alt={decorative ? "" : "AgroFlow"}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
