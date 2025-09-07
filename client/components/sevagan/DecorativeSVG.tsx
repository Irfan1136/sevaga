export default function DecorativeSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`w-24 h-24 text-primary/20 ${className}`}>
      <defs>
        <linearGradient id="d1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#ff8a8a" />
          <stop offset="100%" stopColor="#b21a1a" />
        </linearGradient>
      </defs>
      <g fill="url(#d1)" opacity="0.9">
        <circle cx="20" cy="30" r="12" className="float-anim" />
        <rect x="50" y="10" width="36" height="36" rx="8" className="pulse-anim" />
        <path d="M10 80 C 30 60, 70 100, 90 80" stroke="url(#d1)" strokeWidth="4" fill="none" className="glow-anim" />
      </g>
    </svg>
  );
}
