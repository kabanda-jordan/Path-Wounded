import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { classNames } from '../../lib/formatters'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={classNames(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
          variant === 'secondary' && 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
          variant === 'ghost' && 'hover:bg-white/5 text-slate-300 hover:text-white',
          variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
          size === 'sm' && 'text-xs px-3 py-1.5',
          size === 'md' && 'text-sm px-4 py-2',
          size === 'lg' && 'text-sm px-6 py-3',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
