import Image from 'next/image';

interface EmartAssistantLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-14 w-14 text-2xl',
};

export default function EmartAssistantLogo({
  size = 'md',
  className = '',
}: EmartAssistantLogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-card ring-2 ring-white/70 ${sizeClass[size]} ${className}`}
    >
      <Image
        src="/logo.png"
        alt=""
        width={56}
        height={56}
        className="h-full w-full object-cover"
        sizes="56px"
      />
    </span>
  );
}
