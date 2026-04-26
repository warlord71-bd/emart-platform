import React from 'react';

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
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none';

    const variantStyles = {
      primary: 'rounded-pill bg-ink text-white hover:bg-black active:scale-95',
      secondary: 'rounded-pill bg-accent text-white hover:bg-accent-deep active:scale-95',
      outline: 'rounded-pill border border-ink text-ink hover:bg-bg-alt',
      ghost: 'rounded-pill text-ink hover:bg-bg-alt',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
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
