import React from 'react';
import { LUMIERE_COLORS } from '@/lib/design-system/colors';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  asChild?: boolean;
  href?: string; // If provided, render as Link
}

/**
 * Lumière Button Component
 * Premium button with multiple variants
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

    const variantStyles = {
      primary: `bg-[${LUMIERE_COLORS.primary}] text-white hover:bg-[${LUMIERE_COLORS.primaryHover}] active:scale-95`,
      secondary: `bg-[${LUMIERE_COLORS.secondary}] text-white hover:bg-[${LUMIERE_COLORS.secondaryHover}] active:scale-95`,
      outline: `border-2 border-[${LUMIERE_COLORS.primary}] text-[${LUMIERE_COLORS.primary}] hover:bg-[${LUMIERE_COLORS.primaryLight}]`,
      ghost: `text-[${LUMIERE_COLORS.primary}] hover:bg-[${LUMIERE_COLORS.primaryLight}]`,
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm font-medium',
      md: 'px-4 py-2.5 text-base font-medium',
      lg: 'px-6 py-3 text-lg font-semibold',
    };

    const buttonClass = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={buttonClass}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
