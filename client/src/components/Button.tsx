import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'cta' | 'outline-light'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 sm:px-4 sm:py-2',
    md: 'text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5',
    lg: 'text-sm sm:text-base px-5 sm:px-8 py-2.5 sm:py-3.5',
  }

  const variantStyles = {
    primary:
      'bg-primary text-ivory hover:bg-secondary shadow-sm active:scale-[0.99]',
    outline:
      'border-2 border-primary text-primary hover:bg-mist active:scale-[0.99]',
    'outline-light':
      'border-2 border-ivory text-ivory hover:bg-ivory hover:text-primary active:scale-[0.99] font-medium',
    cta:
      'bg-cta text-ivory hover:opacity-95 shadow-md hover:shadow-lg active:scale-[0.99] font-semibold',
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
