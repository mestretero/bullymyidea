export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-surface flex items-center justify-center overflow-hidden">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary/10 overflow-hidden">
        <div className="loading-bar h-full bg-primary" />
      </div>

      {/* Massive stroke text marquee */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="loading-marquee whitespace-nowrap font-headline italic font-black uppercase select-none text-stroke"
          style={{ fontSize: 'clamp(8rem, 24vw, 18rem)', opacity: 0.08 }}
        >
          LOADING · LOADING · LOADING · LOADING ·
        </div>
      </div>

      {/* Center pill */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 px-6 py-3 border border-primary/30 bg-black/40 backdrop-blur">
          <span className="loading-dot w-2 h-2 bg-primary rounded-full" />
          <span className="font-label text-[11px] uppercase tracking-[0.35em] text-primary">Loading</span>
        </div>
        <div className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant">
          The brutal truth is on its way
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .loading-bar {
          width: 60%;
          animation: loading-bar 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes loading-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .loading-marquee {
          animation: loading-marquee 18s linear infinite;
        }
        @keyframes loading-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1; transform: scale(1.2); }
        }
        .loading-dot {
          animation: loading-dot 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
