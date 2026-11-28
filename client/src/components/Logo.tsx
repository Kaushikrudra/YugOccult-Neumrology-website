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
      viewBox="0 0 320 88"
      fill="none"
      role="img"
      aria-label={alt}
      className={`aspect-[320/88] max-w-full shrink-0 transition-transform ${className}`}
    >
      <image
        href={logoIcon}
        x="2"
        y="4"
        width="76"
        height="80"
        preserveAspectRatio="xMidYMid meet"
      />

      <text
        x="86"
        y="46"
        style={{
          fontFamily: "Georgia, 'Cormorant Garamond', serif",
          fontSize: '46px',
          fontWeight: 700,
          letterSpacing: '0.4px',
          paintOrder: 'stroke fill',
        }}
      >
        <tspan
          fill={isLight ? '#FBF7EE' : '#2E2A5C'}
          stroke={isLight ? '#FBF7EE' : '#2E2A5C'}
          strokeWidth="0.7px"
        >
          Yug{' '}
        </tspan>
        <tspan fill="#C9A227" stroke="#C9A227" strokeWidth="0.7px">
          Skill
        </tspan>
      </text>

      <text
        x="88"
        y="71"
        style={{
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: '14px',
          fontWeight: 800,
          letterSpacing: '0.52em',
          fill: isLight ? '#EFEAF8' : '#5B3E96',
          stroke: isLight ? '#EFEAF8' : '#5B3E96',
          strokeWidth: '0.5px',
          paintOrder: 'stroke fill',
        }}
      >
        INSTITUTE
      </text>
    </svg>
  )
}

export default Logo
