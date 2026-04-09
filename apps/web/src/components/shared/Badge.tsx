import React from 'react';
import { LUMIERE_COLORS } from '@/lib/design-system/colors';

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
    default: `bg-[${LUMIERE_COLORS.secondary}] text-white`,
    acne: `bg-[${LUMIERE_COLORS.acne}] text-[${LUMIERE_COLORS.acneBorder}] border border-[${LUMIERE_COLORS.acneBorder}]`,
    dryness: `bg-[${LUMIERE_COLORS.dryness}] text-[${LUMIERE_COLORS.drynessBorder}] border border-[${LUMIERE_COLORS.drynessBorder}]`,
    brightening: `bg-[${LUMIERE_COLORS.brightening}] text-[${LUMIERE_COLORS.brighteningText}]`,
    antiaging: `bg-[${LUMIERE_COLORS.antiAging}] text-[${LUMIERE_COLORS.antiAgingBorder}] border border-[${LUMIERE_COLORS.antiAgingBorder}]`,
    sensitivity: `bg-[${LUMIERE_COLORS.sensitivity}] text-[${LUMIERE_COLORS.sensitivityBorder}] border border-[${LUMIERE_COLORS.sensitivityBorder}]`,
    discount: `bg-[${LUMIERE_COLORS.primary}] text-white font-bold`,
    new: `bg-[${LUMIERE_COLORS.secondary}] text-white font-bold`,
    sale: `bg-[${LUMIERE_COLORS.primary}] text-white font-bold`,
  };

  const baseStyles = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
