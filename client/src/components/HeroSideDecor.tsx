import React from 'react'

export interface HeroSideDecorProps {
  className?: string
  color?: string
}

export const HeroSideDecor: React.FC<HeroSideDecorProps> = ({
  className = '',
  color = '#C9A227',
}) => {
  const cx = 1000
  const cy = 1000

  // Radii relative to center (approximately 1.35x, 1.75x, 2.20x, 2.70x of base wheel radius 350)
  const r1 = 472
  const r2 = 612
  const r3 = 770
  const r4 = 945

  return (
    <svg
      viewBox="0 0 2000 2000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {/* 1. Orbit Ring 1 (1.35x radius, strokeOpacity 0.35) */}
      <circle
        cx={cx}
        cy={cy}
        r={r1}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.35}
        className="opacity-70 md:opacity-100"
      />
      {/* Ring 1 Planets */}
      {/* Planet 1 Left with halo */}
      <circle cx={544} cy={1122} r={14} fill={color} fillOpacity={0.15} />
      <circle cx={544} cy={1122} r={6} fill={color} fillOpacity={0.85} />
      {/* Planet 2 Right */}
      <circle cx={1456} cy={1122} r={7} fill="#EFEAF8" fillOpacity={0.85} />
      {/* Planet 3 Left-Top */}
      <circle cx={544} cy={878} r={5} fill={color} fillOpacity={0.75} />

      {/* 2. Orbit Ring 2 (1.75x radius, dashed, strokeOpacity 0.28) */}
      <circle
        cx={cx}
        cy={cy}
        r={r2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 10"
        strokeOpacity={0.28}
        className="opacity-70 md:opacity-100"
      />
      {/* Ring 2 Planets */}
      {/* Planet 4 Left with halo */}
      <circle cx={499} cy={1351} r={15} fill={color} fillOpacity={0.15} />
      <circle cx={499} cy={1351} r={7.5} fill="#EFEAF8" fillOpacity={0.85} />
      {/* Planet 5 Right */}
      <circle cx={1501} cy={1351} r={6} fill={color} fillOpacity={0.8} />
      {/* Planet 6 Right-Top */}
      <circle cx={1555} cy={741} r={8} fill={color} fillOpacity={0.85} />

      {/* 3. Orbit Ring 3 (2.20x radius, strokeOpacity 0.20, desktop/tablet only) */}
      <g className="hidden md:block">
        <circle
          cx={cx}
          cy={cy}
          r={r3}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.2}
        />
        {/* Planet 7 Left with halo */}
        <circle cx={276} cy={1263} r={16} fill={color} fillOpacity={0.15} />
        <circle cx={276} cy={1263} r={8.5} fill={color} fillOpacity={0.85} />
        {/* Planet 8 Right */}
        <circle cx={1724} cy={1263} r={7} fill="#EFEAF8" fillOpacity={0.8} />
        {/* Planet 9 Left-Top */}
        <circle cx={302} cy={675} r={6} fill={color} fillOpacity={0.75} />
      </g>

      {/* 4. Orbit Ring 4 (2.70x radius, strokeOpacity 0.14, desktop/tablet only) */}
      <g className="hidden md:block">
        <circle
          cx={cx}
          cy={cy}
          r={r4}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.14}
        />
        {/* Planet 10 Left with halo */}
        <circle cx={59} cy={1082} r={16} fill={color} fillOpacity={0.15} />
        <circle cx={59} cy={1082} r={8} fill="#EFEAF8" fillOpacity={0.85} />
        {/* Planet 11 Right */}
        <circle cx={1941} cy={1082} r={9} fill={color} fillOpacity={0.85} />
        {/* Planet 12 Right-Top */}
        <circle cx={1913} cy={755} r={7} fill="#EFEAF8" fillOpacity={0.75} />
      </g>

      {/* 5. Left Constellation Connecting Lines and Fixed Stars */}
      <g className="hidden md:block">
        <polyline
          points="200,750 120,880 220,1000 150,1130 70,1210"
          stroke={color}
          strokeWidth={0.8}
          strokeOpacity={0.3}
          strokeDasharray="3 5"
        />
        <circle cx={200} cy={750} r={2.5} fill={color} fillOpacity={0.65} />
        <circle cx={120} cy={880} r={3.0} fill={color} fillOpacity={0.75} />
        <circle cx={220} cy={1000} r={2.8} fill={color} fillOpacity={0.7} />
        <circle cx={150} cy={1130} r={3.2} fill={color} fillOpacity={0.8} />
        <circle cx={70} cy={1210} r={2.4} fill={color} fillOpacity={0.65} />
      </g>

      {/* 6. Right Constellation Connecting Lines and Fixed Stars */}
      <g className="hidden md:block">
        <polyline
          points="1800,750 1880,880 1780,1000 1850,1130 1930,1210"
          stroke={color}
          strokeWidth={0.8}
          strokeOpacity={0.3}
          strokeDasharray="3 5"
        />
        <circle cx={1800} cy={750} r={2.5} fill={color} fillOpacity={0.65} />
        <circle cx={1880} cy={880} r={3.0} fill={color} fillOpacity={0.75} />
        <circle cx={1780} cy={1000} r={2.8} fill={color} fillOpacity={0.7} />
        <circle cx={1850} cy={1130} r={3.2} fill={color} fillOpacity={0.8} />
        <circle cx={1930} cy={1210} r={2.4} fill={color} fillOpacity={0.65} />
      </g>

      {/* 7. Subtle Fixed Ambient Starlets along Outer Wings */}
      <g className="hidden md:block">
        <circle cx={90} cy={680} r={1.6} fill={color} fillOpacity={0.45} />
        <circle cx={160} cy={1340} r={1.8} fill={color} fillOpacity={0.5} />
        <circle cx={1840} cy={680} r={1.6} fill={color} fillOpacity={0.45} />
        <circle cx={1910} cy={1340} r={1.8} fill={color} fillOpacity={0.5} />
        <circle cx={340} cy={540} r={1.5} fill={color} fillOpacity={0.4} />
        <circle cx={1660} cy={540} r={1.5} fill={color} fillOpacity={0.4} />
      </g>
    </svg>
  )
}

export default HeroSideDecor
