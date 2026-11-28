import React from 'react'
import logoIcon from '../assets/logo/logo-icon.png'

export interface LogoProps {
  variant?: 'full' | 'icon' | 'light'
  className?: string
  alt?: string
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  className = '',
  alt = 'Yug Skill Institute',
}) => {
  if (variant === 'icon') {
    return (
      <img
        src={logoIcon}
        alt={alt}
        className={`w-auto max-w-full shrink-0 object-contain transition-transform ${className}`}
        loading="eager"
      />
    )
  }

  const isLight = variant === 'light'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 90"
      fill="none"
      role="img"
      aria-label={alt}
      className={`aspect-[300/90] max-w-full shrink-0 transition-transform ${className}`}
    >
      <image
        href={logoIcon}
        x="4"
        y="3"
        width="84"
        height="84"
        preserveAspectRatio="xMidYMid meet"
      />

      <text
        x="100"
        y="46"
        style={{
          fontFamily: "Georgia, 'Cormorant Garamond', serif",
          fontSize: '39px',
          fontWeight: 700,
          letterSpacing: '0.5px',
          paintOrder: 'stroke fill',
        }}
      >
        <tspan
          fill={isLight ? '#FBF7EE' : '#2E2A5C'}
          stroke={isLight ? '#FBF7EE' : '#2E2A5C'}
          strokeWidth="0.6px"
        >
          Yug{' '}
        </tspan>
        <tspan fill="#C9A227" stroke="#C9A227" strokeWidth="0.6px">
          Skill
        </tspan>
      </text>

      <text
        x="101"
        y="68"
        style={{
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: '11.5px',
          fontWeight: 800,
          letterSpacing: '0.46em',
          fill: isLight ? '#EFEAF8' : '#5B3E96',
          stroke: isLight ? '#EFEAF8' : '#5B3E96',
          strokeWidth: '0.4px',
          paintOrder: 'stroke fill',
        }}
      >
        INSTITUTE
      </text>
    </svg>
  )
}

export default Logo
