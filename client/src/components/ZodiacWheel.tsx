import React, { useMemo } from 'react'

export interface ZodiacWheelProps {
  className?: string
  color?: string
  size?: number | string
  style?: React.CSSProperties
}

interface ZodiacSign {
  name: string
  glyph: string
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Aries', glyph: '\u2648\uFE0E' },
  { name: 'Taurus', glyph: '\u2649\uFE0E' },
  { name: 'Gemini', glyph: '\u264A\uFE0E' },
  { name: 'Cancer', glyph: '\u264B\uFE0E' },
  { name: 'Leo', glyph: '\u264C\uFE0E' },
  { name: 'Virgo', glyph: '\u264D\uFE0E' },
  { name: 'Libra', glyph: '\u264E\uFE0E' },
  { name: 'Scorpio', glyph: '\u264F\uFE0E' },
  { name: 'Sagittarius', glyph: '\u2650\uFE0E' },
  { name: 'Capricorn', glyph: '\u2651\uFE0E' },
  { name: 'Aquarius', glyph: '\u2652\uFE0E' },
  { name: 'Pisces', glyph: '\u2653\uFE0E' },
]

// Deterministic fixed star dots with enhanced brightness (opacity 0.70 - 0.95)
const FIXED_STARS: Array<{ cx: number; cy: number; r: number; opacity: number }> = [
  { cx: 500, cy: 260, r: 2.5, opacity: 0.9 },
  { cx: 410, cy: 280, r: 2.0, opacity: 0.75 },
  { cx: 590, cy: 280, r: 2.0, opacity: 0.75 },
  { cx: 330, cy: 350, r: 2.8, opacity: 0.85 },
  { cx: 670, cy: 350, r: 2.8, opacity: 0.85 },
  { cx: 280, cy: 450, r: 2.2, opacity: 0.75 },
  { cx: 720, cy: 450, r: 2.2, opacity: 0.75 },
  { cx: 290, cy: 550, r: 2.6, opacity: 0.85 },
  { cx: 710, cy: 550, r: 2.6, opacity: 0.85 },
  { cx: 350, cy: 650, r: 2.4, opacity: 0.8 },
  { cx: 650, cy: 650, r: 2.4, opacity: 0.8 },
  { cx: 430, cy: 720, r: 2.7, opacity: 0.85 },
  { cx: 570, cy: 720, r: 2.7, opacity: 0.85 },
  { cx: 500, cy: 740, r: 2.5, opacity: 0.8 },
  { cx: 390, cy: 430, r: 2.4, opacity: 0.9 },
  { cx: 610, cy: 430, r: 2.4, opacity: 0.9 },
  { cx: 380, cy: 570, r: 2.2, opacity: 0.75 },
  { cx: 620, cy: 570, r: 2.2, opacity: 0.75 },
  { cx: 450, cy: 360, r: 2.5, opacity: 0.85 },
  { cx: 550, cy: 360, r: 2.5, opacity: 0.85 },
  { cx: 450, cy: 640, r: 2.3, opacity: 0.8 },
  { cx: 550, cy: 640, r: 2.3, opacity: 0.8 },
  { cx: 230, cy: 390, r: 2.2, opacity: 0.7 },
  { cx: 770, cy: 390, r: 2.2, opacity: 0.7 },
  { cx: 220, cy: 610, r: 2.6, opacity: 0.75 },
  { cx: 780, cy: 610, r: 2.6, opacity: 0.75 },
  { cx: 410, cy: 200, r: 2.8, opacity: 0.9 },
  { cx: 590, cy: 200, r: 2.8, opacity: 0.9 },
  { cx: 410, cy: 800, r: 2.3, opacity: 0.75 },
  { cx: 590, cy: 800, r: 2.3, opacity: 0.75 },
]

export const ZodiacWheel: React.FC<ZodiacWheelProps> = ({
  className = '',
  color = '#C9A227',
  size,
  style,
}) => {
  const cx = 500
  const cy = 500

  // 12 equal sections divider lines (every 30 degrees, from inner sign ring 345 to outer rim 475)
  const dividers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angleDeg = -90 + i * 30
      const rad = (angleDeg * Math.PI) / 180
      const x1 = cx + 345 * Math.cos(rad)
      const y1 = cy + 345 * Math.sin(rad)
      const x2 = cx + 475 * Math.cos(rad)
      const y2 = cy + 475 * Math.sin(rad)
      return { x1, y1, x2, y2, angleDeg }
    })
  }, [])

  // 72 micro-degree tick marks on outer dial (every 5 degrees)
  const ticks = useMemo(() => {
    return Array.from({ length: 72 }).map((_, i) => {
      const angleDeg = i * 5
      const rad = (angleDeg * Math.PI) / 180
      const isMajor = i % 6 === 0 // every 30 deg
      const isMedium = i % 2 === 0 // every 10 deg
      const innerR = isMajor ? 456 : isMedium ? 462 : 467
      const x1 = cx + innerR * Math.cos(rad)
      const y1 = cy + innerR * Math.sin(rad)
      const x2 = cx + 475 * Math.cos(rad)
      const y2 = cy + 475 * Math.sin(rad)
      return {
        x1,
        y1,
        x2,
        y2,
        opacity: isMajor ? 0.65 : isMedium ? 0.5 : 0.35,
        strokeWidth: isMajor ? 1.8 : 1.2,
      }
    })
  }, [])

  // 12 Zodiac signs positioned in the center of each 30-degree sector
  // Each has a circular disk badge and an inward text label
  const signPositions = useMemo(() => {
    const rGlyph = 395
    const rLabel = 328
    return ZODIAC_SIGNS.map((sign, i) => {
      const centerAngleDeg = -90 + 15 + i * 30
      const rad = (centerAngleDeg * Math.PI) / 180

      // Glyph & circular badge coordinates
      const x = cx + rGlyph * Math.cos(rad)
      const y = cy + rGlyph * Math.sin(rad)

      // Inward text label coordinates (e.g. ARIES, TAURUS)
      const labelX = cx + rLabel * Math.cos(rad)
      const labelY = cy + rLabel * Math.sin(rad)

      // Rotation angle following circular trajectory
      const rotationDeg = centerAngleDeg + 90

      return {
        ...sign,
        x,
        y,
        labelX,
        labelY,
        rotationDeg,
      }
    })
  }, [])

  // Sacred 8-pointed star emblem at center (500, 500)
  const starPath = useMemo(() => {
    const outerR = 42
    const innerR = 18
    const points: string[] = []
    for (let k = 0; k < 16; k++) {
      const rad = (k * 22.5 * Math.PI) / 180
      const r = k % 2 === 0 ? outerR : innerR
      const x = cx + r * Math.cos(rad)
      const y = cy + r * Math.sin(rad)
      points.push(`${k === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    }
    points.push('Z')
    return points.join(' ')
  }, [])

  // 8 Cardinal and diagonal radiant lines from center hub
  const centralRays = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angleDeg = i * 45
      const rad = (angleDeg * Math.PI) / 180
      const x1 = cx + 50 * Math.cos(rad)
      const y1 = cy + 50 * Math.sin(rad)
      const x2 = cx + 180 * Math.cos(rad)
      const y2 = cy + 180 * Math.sin(rad)
      return { x1, y1, x2, y2 }
    })
  }, [])

  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      aria-hidden="true"
      role="presentation"
    >
      {/* 1. Outer Concentric Rings */}
      {/* Outermost rim (high visibility 0.95, strokeWidth 2.5) */}
      <circle
        cx={cx}
        cy={cy}
        r={475}
        stroke={color}
        strokeWidth={2.5}
        strokeOpacity={0.95}
      />
      {/* Outer glyph border (visibility 0.75, strokeWidth 2.0) */}
      <circle
        cx={cx}
        cy={cy}
        r={445}
        stroke={color}
        strokeWidth={2.0}
        strokeOpacity={0.75}
      />
      {/* Inner glyph border (visibility 0.75, strokeWidth 2.0) */}
      <circle
        cx={cx}
        cy={cy}
        r={345}
        stroke={color}
        strokeWidth={2.0}
        strokeOpacity={0.75}
      />

      {/* Outer Degree Ticks */}
      <g>
        {ticks.map((tick, idx) => (
          <line
            key={`tick-${idx}`}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={color}
            strokeWidth={tick.strokeWidth}
            strokeOpacity={tick.opacity}
          />
        ))}
      </g>

      {/* 2. 12 Sector Dividers (visibility 0.60) */}
      <g>
        {dividers.map((div, idx) => (
          <line
            key={`div-${idx}`}
            x1={div.x1}
            y1={div.y1}
            x2={div.x2}
            y2={div.y2}
            stroke={color}
            strokeWidth={1.8}
            strokeOpacity={0.6}
          />
        ))}
      </g>

      {/* 3. Circular Badges / Disks for each Zodiac Sign (strokeOpacity 0.9) */}
      <g>
        {signPositions.map((sign) => (
          <circle
            key={`badge-${sign.name}`}
            cx={sign.x}
            cy={sign.y}
            r={42}
            fill="rgba(46, 42, 92, 0.65)"
            stroke={color}
            strokeWidth={1.8}
            strokeOpacity={0.9}
          />
        ))}
      </g>

      {/* 4. 12 Zodiac Glyphs (Prominent, font-size 58px, bold, opacity 1.0) */}
      <g
        style={{
          fontFamily:
            '"Noto Sans Symbols", "Segoe UI Symbol", "DejaVu Sans", sans-serif',
        }}
      >
        {signPositions.map((sign) => (
          <text
            key={`glyph-${sign.name}`}
            x={sign.x}
            y={sign.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="58"
            fontWeight="bold"
            fill={color}
            fillOpacity={1.0}
            transform={`rotate(${sign.rotationDeg}, ${sign.x}, ${sign.y})`}
          >
            {sign.glyph}
          </text>
        ))}
      </g>

      {/* 5. Inward Sign Name Labels (ARIES, TAURUS, etc., font-size 14px, fill #EFEAF8, opacity 0.95) */}
      <g
        style={{
          fontFamily: "'Poppins', sans-serif",
          letterSpacing: '0.18em',
        }}
      >
        {signPositions.map((sign) => (
          <text
            key={`label-${sign.name}`}
            x={sign.labelX}
            y={sign.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
            fontWeight="600"
            fill="#EFEAF8"
            fillOpacity={0.95}
            transform={`rotate(${sign.rotationDeg}, ${sign.labelX}, ${sign.labelY})`}
          >
            {sign.name.toUpperCase()}
          </text>
        ))}
      </g>

      {/* 6. Middle Concentric Rings & Sacred Geometry (opacity 0.6) */}
      {/* Dotted orbital ring */}
      <circle
        cx={cx}
        cy={cy}
        r={295}
        stroke={color}
        strokeWidth={1.6}
        strokeDasharray="5 8"
        strokeOpacity={0.6}
      />
      {/* Middle ring */}
      <circle
        cx={cx}
        cy={cy}
        r={210}
        stroke={color}
        strokeWidth={1.8}
        strokeOpacity={0.6}
      />
      {/* Intersecting Sacred Decagon / Star Geometry */}
      <circle
        cx={cx}
        cy={cy}
        r={160}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 6"
        strokeOpacity={0.55}
      />
      {/* Inner dotted hub ring */}
      <circle
        cx={cx}
        cy={cy}
        r={105}
        stroke={color}
        strokeWidth={1.8}
        strokeDasharray="4 6"
        strokeOpacity={0.6}
      />
      {/* Center boundary ring */}
      <circle
        cx={cx}
        cy={cy}
        r={50}
        stroke={color}
        strokeWidth={2.0}
        strokeOpacity={0.75}
      />

      {/* 7. Central Rays */}
      <g>
        {centralRays.map((ray, idx) => (
          <line
            key={`ray-${idx}`}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={color}
            strokeWidth={1.2}
            strokeDasharray="3 4"
            strokeOpacity={0.6}
          />
        ))}
      </g>

      {/* 8. Center Emblem: 8-Pointed Star (opacity 0.95 - 1.0) */}
      <path
        d={starPath}
        fill={color}
        fillOpacity={0.95}
        stroke={color}
        strokeWidth={1.8}
        strokeOpacity={1.0}
      />
      {/* Central focal core dot */}
      <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={1.0} />

      {/* 9. Deterministic Fixed Star Dots (opacity 0.70 - 0.95) */}
      <g>
        {FIXED_STARS.map((star, idx) => (
          <circle
            key={`star-${idx}`}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill={color}
            fillOpacity={star.opacity}
          />
        ))}
      </g>
    </svg>
  )
}

export default ZodiacWheel
