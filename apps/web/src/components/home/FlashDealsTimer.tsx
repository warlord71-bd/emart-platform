'use client';

import { useState, useEffect } from 'react';

function getTimeLeft() {
  const now = Date.now();
  const cycle = 6 * 60 * 60 * 1000; // 6 hours
  const remaining = cycle - (now % cycle);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { h, m, s };
}

export default function FlashDealsTimer() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-gray-500 hidden sm:inline">Ends in</span>
      {[time.h, time.m, time.s].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-[#1a1a2e] text-white font-bold px-2 py-1 rounded text-xs min-w-[28px] text-center">
            {pad(v)}
          </span>
          {i < 2 && <span className="text-gray-400 font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}
