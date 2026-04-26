import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'acne' | 'dryness' | 'brightening' | 'antiaging' | 'sensitivity' | 'discount' | 'new' | 'sale';
  className?: string;
}

/**
 * Lumière Badge Component
 * Used for skin concerns, discounts, status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const variantStyles = {
    default: 'border border-success/20 bg-success-soft text-success',
    acne: 'border border-success/25 bg-success-soft text-success',
    dryness: 'border border-warning/25 bg-warning-soft text-warning',
    brightening: 'bg-ink text-white',
    antiaging: 'border border-accent/25 bg-accent-soft text-accent',
    sensitivity: 'border border-success/25 bg-success-soft text-success',
    discount: 'bg-accent font-mono font-bold uppercase tracking-[0.1em] text-white',
    new: 'bg-ink font-mono font-bold uppercase tracking-[0.1em] text-white',
    sale: 'bg-accent font-mono font-bold uppercase tracking-[0.1em] text-white',
  };

  const baseStyles = 'inline-flex items-center rounded-[4px] px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
