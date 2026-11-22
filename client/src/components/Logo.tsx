import React from 'react'
import logoFull from '../assets/logo/logo-full.svg'
import logoIcon from '../assets/logo/logo-icon.svg'
import logoLight from '../assets/logo/logo-light.svg'

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
  const getLogoSource = () => {
    switch (variant) {
      case 'icon':
        return logoIcon
      case 'light':
        return logoLight
      case 'full':
      default:
        return logoFull
    }
  }

  const baseClasses = 'w-auto max-w-full shrink-0 object-contain transition-transform'

  return (
    <img
      src={getLogoSource()}
      alt={alt}
      className={`${baseClasses} ${className}`}
      loading="eager"
    />
  )
}

export default Logo
