export default function MarketBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* AI GRID */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M80 0 L0 0 0 80"
              fill="none"
              stroke="#1e40af"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* MARKET LINES */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        {/* Line 1 */}
        <path
          d="M0 300 L150 280 L300 320 L450 200 L600 230 L750 150 L900 190 L1050 120 L1200 160"
          className="market-line market-line-1"
        />

        {/* Line 2 */}
        <path
          d="M0 260 L120 250 L260 280 L400 210 L520 240 L680 170 L820 210 L980 150 L1200 190"
          className="market-line market-line-2"
        />

        {/* Line 3 */}
        <path
          d="M0 320 L200 300 L340 330 L500 260 L650 280 L820 200 L960 240 L1100 180 L1200 210"
          className="market-line market-line-3"
        />

        {/* PRICE PULSES */}
        <circle cx="450" cy="200" r="6" className="pulse" />
        <circle cx="750" cy="150" r="6" className="pulse delay-1" />
        <circle cx="1050" cy="120" r="6" className="pulse delay-2" />
      </svg>
    </div>
  );
}
