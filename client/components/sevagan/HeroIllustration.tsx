export default function HeroIllustration() {
  return (
    <div className="absolute right-0 top-0 opacity-10 w-96 h-96 transform translate-x-20 -translate-y-24 text-primary pointer-events-none">
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full float-anim"
      >
        <defs>
          <linearGradient id="g1" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#b21a1a" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#softGlow)">
          <path
            fill="url(#g1)"
            d="M47.6,-37.9C60.1,-24.7,67.3,-3.3,63.9,15.1C60.5,33.5,46.5,49.7,28.4,57.8C10.3,66,-11.9,66,-30.4,58.5C-48.9,50.9,-63.6,35.9,-67,17.3C-70.3,-1.3,-62.3,-23.3,-47.6,-36.4C-32.9,-49.6,-16.5,-53.8,1.1,-54.9C18.7,-56.1,37.3,-54,47.6,-37.9Z"
            transform="translate(100 100)"
            className="pulse-anim"
          />
        </g>
      </svg>
    </div>
  );
}
