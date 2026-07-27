export default function AmexLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "sm"
      ? "w-10 h-8 text-[7px]"
      : size === "lg"
        ? "w-20 h-16 text-[11px]"
        : "w-14 h-11 text-[9px]";
  return (
    <div
      className={`bg-amex text-white font-extrabold flex flex-col items-center justify-center rounded-[3px] leading-tight tracking-wide select-none ${dims}`}
    >
      <span>AMERICAN</span>
      <span>EXPRESS</span>
    </div>
  );
}
