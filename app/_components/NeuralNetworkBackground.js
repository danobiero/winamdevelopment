export default function NeuralNetworkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <svg
        viewBox="0 0 1400 800"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* CONNECTION LINES */}
        <g className="neural-lines">
          <line x1="200" y1="200" x2="500" y2="350" />
          <line x1="200" y1="200" x2="500" y2="120" />
          <line x1="500" y1="350" x2="850" y2="250" />
          <line x1="500" y1="120" x2="850" y2="450" />
          <line x1="850" y1="250" x2="1150" y2="300" />
          <line x1="850" y1="450" x2="1150" y2="500" />
        </g>

        {/* NODES */}
        <g className="neural-nodes">
          <circle cx="200" cy="200" r="6" />
          <circle cx="500" cy="350" r="6" />
          <circle cx="500" cy="120" r="6" />
          <circle cx="850" cy="250" r="6" />
          <circle cx="850" cy="450" r="6" />
          <circle cx="1150" cy="300" r="6" />
          <circle cx="1150" cy="500" r="6" />
        </g>
      </svg>
    </div>
  );
}
