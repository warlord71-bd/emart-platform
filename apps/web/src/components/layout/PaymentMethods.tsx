import React from 'react';

interface PaymentMethod {
  name: string;
  bg: string;
  text: string;
  icon: React.ReactNode;
}

export const PaymentMethods: React.FC = () => {
  const methods: PaymentMethod[] = [
    {
      name: 'bKash',
      bg: 'bg-gradient-to-br from-accent to-[#d55f78]',
      text: 'text-white',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
          <text x="50" y="60" fontSize="48" fontWeight="bold" fill="white" textAnchor="middle">
            ৳
          </text>
        </svg>
      ),
    },
    {
      name: 'Nagad',
      bg: 'bg-gradient-to-br from-orange-500 to-red-600',
      text: 'text-white',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" fill="none" />
          <text x="50" y="65" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle">
            ℕ
          </text>
        </svg>
      ),
    },
    {
      name: 'Visa',
      bg: 'bg-blue-600',
      text: 'text-white',
      icon: (
        <svg className="w-10 h-6" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" rx="4" fill="#1434CB" />
          <text x="50" y="42" fontSize="28" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">
            VISA
          </text>
        </svg>
      ),
    },
    {
      name: 'Mastercard',
      bg: 'border border-hairline bg-card',
      text: 'text-gray-900',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
          <circle cx="35" cy="50" r="25" fill="#FF5F00" />
          <circle cx="65" cy="50" r="25" fill="#EB001B" />
          <circle cx="50" cy="50" r="15" fill="#FF5F00" opacity="0.5" />
        </svg>
      ),
    },
    {
      name: 'JCB',
      bg: 'bg-gradient-to-br from-blue-600 via-red-600 to-green-600',
      text: 'text-white',
      icon: (
        <svg className="w-8 h-6" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" fill="none" />
          <text x="50" y="42" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">
            JCB
          </text>
        </svg>
      ),
    },
    {
      name: 'Amex',
      bg: 'bg-blue-800',
      text: 'text-white',
      icon: (
        <svg className="w-8 h-5" viewBox="0 0 100 60" fill="none">
          <rect width="100" height="60" fill="#006FCF" />
          <text x="50" y="42" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="serif">
            AXP
          </text>
        </svg>
      ),
    },
    {
      name: 'COD',
      bg: 'bg-ink',
      text: 'text-white',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
          <text x="50" y="65" fontSize="48" fontWeight="bold" fill="white" textAnchor="middle">
            💵
          </text>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {methods.map((method) => (
        <div
          key={method.name}
          className={`flex h-12 w-16 cursor-pointer items-center justify-center rounded-xl transition-all hover:scale-105 hover:shadow-card ${method.bg}`}
          title={method.name}
        >
          {method.icon}
        </div>
      ))}
    </div>
  );
};
