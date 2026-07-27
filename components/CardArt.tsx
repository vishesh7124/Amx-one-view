export default function CardArt({
  variant = "platinum",
  name = "AARAV SHARMA",
  last4 = "1005",
  compact = false,
}: {
  variant?: "platinum" | "gold" | "blue";
  name?: string;
  last4?: string;
  compact?: boolean;
}) {
  const sheen =
    variant === "gold"
      ? "card-sheen-gold"
      : variant === "blue"
        ? "card-sheen"
        : "card-sheen-platinum";
  return (
    <div
      className={`${sheen} text-white rounded-2xl shadow-lg relative overflow-hidden ${
        compact ? "w-64 h-40 p-4" : "w-80 h-48 p-5"
      }`}
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-16 w-24 h-24 rounded-full bg-white/10" />
      <p className="text-[10px] font-bold tracking-widest">AMERICAN EXPRESS</p>
      <div className={`${compact ? "mt-4" : "mt-6"} w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-90`} />
      <p className={`font-mono tracking-[0.18em] ${compact ? "text-xs mt-2" : "text-sm mt-3"}`}>
        3743 •••• •• {last4}
      </p>
      <div className="flex justify-between items-end mt-2">
        <div>
          <p className="text-[8px] opacity-70">CARD MEMBER</p>
          <p className={`font-semibold ${compact ? "text-[10px]" : "text-xs"}`}>{name}</p>
        </div>
        <p className="text-[9px] opacity-80">⦿⦿</p>
      </div>
    </div>
  );
}
