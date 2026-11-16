import React, { useMemo } from 'react'

export interface ZodiacRingEmblemProps {
  className?: string
  color?: string
}

// 12 Classical Zodiac glyphs with text variation selector \uFE0E to prevent emoji rendering
const ZODIAC_GLYPHS = [
  '\u2648\uFE0E', // Aries
  '\u2649\uFE0E', // Taurus
  '\u264A\uFE0E', // Gemini
  '\u264B\uFE0E', // Cancer
  '\u264C\uFE0E', // Leo
  '\u264D\uFE0E', // Virgo
  '\u264E\uFE0E', // Libra
  '\u264F\uFE0E', // Scorpio
  '\u2650\uFE0E', // Sagittarius
  '\u2651\uFE0E', // Capricorn
  '\u2652\uFE0E', // Aquarius
  '\u2653\uFE0E', // Pisces
]

// Deterministic fixed celestial star dots inside inner celestial field
const INNER_STAR_DOTS: Array<{ cx: number; cy: number; r: number; opacity: number }> = [
  { cx: 500, cy: 232, r: 2.2, opacity: 0.75 },
  { cx: 689, cy: 311, r: 2.0, opacity: 0.7 },
  { cx: 768, cy: 500, r: 2.4, opacity: 0.8 },
  { cx: 689, cy: 689, r: 2.0, opacity: 0.7 },
  { cx: 500, cy: 768, r: 2.2, opacity: 0.75 },
  { cx: 311, cy: 689, r: 2.0, opacity: 0.7 },
  { cx: 232, cy: 500, r: 2.4, opacity: 0.8 },
  { cx: 311, cy: 311, r: 2.0, opacity: 0.7 },
  // Second inner ring of dots
  { cx: 500, cy: 297, r: 1.8, opacity: 0.65 },
  { cx: 643, cy: 357, r: 1.8, opacity: 0.65 },
  { cx: 703, cy: 500, r: 2.0, opacity: 0.7 },
  { cx: 643, cy: 643, r: 1.8, opacity: 0.65 },
  { cx: 500, cy: 703, r: 1.8, opacity: 0.65 },
  { cx: 357, cy: 643, r: 1.8, opacity: 0.65 },
  { cx: 297, cy: 500, r: 2.0, opacity: 0.7 },
  { cx: 357, cy: 357, r: 1.8, opacity: 0.65 },
]

export const ZodiacRingEmblem: React.FC<ZodiacRingEmblemProps> = ({
  className = '',
  color = '#C9A227',
}) => {
  const cx = 500
  const cy = 500
  const rInner = 350
  const rOuter = 470
  const rGlyph = 410

  // 12 radial dividers (offset by 15 degrees so glyph sits centered in each 30-degree sector)
  const dividers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angleDeg = -105 + i * 30
      const rad = (angleDeg * Math.PI) / 180
      const x1 = cx + rInner * Math.cos(rad)
      const y1 = cy + rInner * Math.sin(rad)
      const x2 = cx + rOuter * Math.cos(rad)
      const y2 = cy + rOuter * Math.sin(rad)
      return { x1, y1, x2, y2 }
    })
  }, [cx, cy, rInner, rOuter])

  // 12 upright zodiac glyphs at radius ~410 (deterministic trigonometry, strictly non-rotated)
  const glyphItems = useMemo(() => {
    return ZODIAC_GLYPHS.map((glyph, i) => {
      const angleDeg = -90 + i * 30
      const rad = (angleDeg * Math.PI) / 180
      const x = cx + rGlyph * Math.cos(rad)
      const y = cy + rGlyph * Math.sin(rad)
      return { glyph, x, y, id: `glyph-${i}` }
    })
  }, [cx, cy, rGlyph])

  // 8-pointed gold star polygon (outer radius 80, inner radius 34)
  const starPoints = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? 80 : 34
      const angleDeg = -90 + i * 22.5
      const rad = (angleDeg * Math.PI) / 180
      const x = (cx + r * Math.cos(rad)).toFixed(2)
      const y = (cy + r * Math.sin(rad)).toFixed(2)
      pts.push(`${x},${y}`)
    }
    return pts.join(' ')
  }, [cx, cy])

  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      role="presentation"
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        {/* Soft Gold Radial Glow behind entire emblem */}
        <radialGradient id="zodiacEmblemBgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="65%" stopColor={color} stopOpacity="0.06" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>

        {/* Soft Center Star Glow */}
        <radialGradient id="centerStarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="60%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Overall Background Subtle Gold Glow */}
      <circle cx={cx} cy={cy} r="490" fill="url(#zodiacEmblemBgGlow)" />

      {/* 2. STATIONARY GLYPH BAND & OUTER/INNER RINGS */}
      {/* Outer Gold Ring (radius 470, stroke ~3, opacity 0.9) */}
      <circle
        cx={cx}
        cy={cy}
        r={rOuter}
        stroke={color}
        strokeWidth="3"
        strokeOpacity="0.9"
      />

      {/* Subtle outer accent hairline ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rOuter + 6}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {/* Inner Gold Ring (radius 350, stroke ~3, opacity 0.9) */}
      <circle
        cx={cx}
        cy={cy}
        r={rInner}
        stroke={color}
        strokeWidth="3"
        strokeOpacity="0.9"
      />

      {/* Subtle inner accent hairline ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rInner - 6}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {/* 12 Radial Dividers (15° offset, opacity ~0.55) */}
      <g>
        {dividers.map((d, idx) => (
          <line
            key={`divider-${idx}`}
            x1={d.x1.toFixed(2)}
            y1={d.y1.toFixed(2)}
            x2={d.x2.toFixed(2)}
            y2={d.y2.toFixed(2)}
            stroke={color}
            strokeWidth="1.75"
            strokeOpacity="0.55"
          />
        ))}
      </g>

      {/* 12 Upright Zodiac Glyphs (no rotation, strictly upright) */}
      <g>
        {glyphItems.map((item) => (
          <text
            key={item.id}
            x={item.x.toFixed(2)}
            y={item.y.toFixed(2)}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize="64"
            fontWeight="600"
            fontFamily="'Noto Sans Symbols', 'Segoe UI Symbol', 'DejaVu Sans', sans-serif"
            style={{
              userSelect: 'none',
              filter: 'drop-shadow(0px 2px 4px rgba(30, 27, 75, 0.45))',
            }}
          >
            {item.glyph}
          </text>
        ))}
      </g>

      {/* 3. ROTATING INNER CELESTIAL ELEMENTS (Only these 3 circles rotate slowly) */}
      {/* Outer Dotted Circle (radius ~300, clockwise 240s) */}
      <g className="animate-emblem-cw">
        <circle
          cx={cx}
          cy={cy}
          r="300"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="1 14"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {/* Subtle decorative planet/star nodes on r=300 */}
        <circle cx="500" cy="200" r="3" fill={color} fillOpacity="0.8" />
        <circle cx="800" cy="500" r="3" fill={color} fillOpacity="0.8" />
        <circle cx="500" cy="800" r="3" fill={color} fillOpacity="0.8" />
        <circle cx="200" cy="500" r="3" fill={color} fillOpacity="0.8" />
      </g>

      {/* Middle Dotted Circle (radius ~235, counter-clockwise 240s) */}
      <g className="animate-emblem-ccw">
        <circle
          cx={cx}
          cy={cy}
          r="235"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="1 14"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Interspersed star dots */}
        {INNER_STAR_DOTS.slice(0, 8).map((star, i) => (
          <circle
            key={`inner-star-${i}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill={color}
            fillOpacity={star.opacity}
          />
        ))}
      </g>

      {/* Inner Dotted Circle (radius ~170, clockwise 240s) */}
      <g className="animate-emblem-cw">
        <circle
          cx={cx}
          cy={cy}
          r="170"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="1 14"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        {/* Inner star dots */}
        {INNER_STAR_DOTS.slice(8).map((star, i) => (
          <circle
            key={`inner-star-core-${i}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill={color}
            fillOpacity={star.opacity}
          />
        ))}
      </g>

      {/* 4. CENTER 8-POINTED STAR & GLOW */}
      {/* Center Soft Gold Glow */}
      <circle cx={cx} cy={cy} r="135" fill="url(#centerStarGlow)" />

      {/* 8-Pointed Vedic Gold Star */}
      <polygon
        points={starPoints}
        fill={color}
        style={{
          filter: 'drop-shadow(0px 2px 8px rgba(30, 27, 75, 0.45))',
        }}
      />

      {/* Sacred Central Bindu Point */}
      <circle cx={cx} cy={cy} r="2.8" fill="#FFFFFF" />
    </svg>
  )
}

export default ZodiacRingEmblem
