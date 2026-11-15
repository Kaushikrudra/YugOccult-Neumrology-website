import React from 'react'

export interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const isCenter = align === 'center'

  return (
    <div
      className={`mb-8 sm:mb-12 ${
        isCenter ? 'text-center mx-auto max-w-4xl' : 'text-left max-w-4xl'
      } ${className}`}
    >
      {eyebrow && (
        <p className="text-[11px] sm:text-sm font-semibold tracking-widest uppercase text-accent mb-1.5 sm:mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-primary mb-2.5 sm:mb-3 leading-tight">
        {title}
      </h2>
      <div
        className={`w-12 sm:w-16 h-1 bg-accent/60 rounded-full mb-3 sm:mb-4 ${
          isCenter ? 'mx-auto' : ''
        }`}
      />
      {subtitle && (
        <p className="text-ink/80 text-xs sm:text-base leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default SectionHeading
