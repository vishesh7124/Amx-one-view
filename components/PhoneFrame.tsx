export default function PhoneFrame({
  children,
  title = "Amex",
  footer,
}: {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-[390px] max-w-[95vw]">
      <div className="rounded-[2.6rem] border-[10px] border-gray-900 bg-white shadow-2xl overflow-hidden">
        {/* status bar */}
        <div className="bg-white px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-gray-800">
          <span>9:41</span>
          <div className="w-24 h-6 bg-gray-900 rounded-full -mt-1" />
          <span className="flex items-center gap-1">
            <span className="text-[10px]">5G</span> 🔋
          </span>
        </div>
        {/* screen: scrollable content + pinned footer (tab bar) */}
        <div className="h-[720px] max-h-[74vh] bg-mist flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin relative">
            {children}
          </div>
          {footer && <div className="shrink-0">{footer}</div>}
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">
        📱 American Express App — mockup · {title}
      </p>
    </div>
  );
}
