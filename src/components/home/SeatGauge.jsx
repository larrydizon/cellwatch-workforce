import React from 'react';

// Semicircular seat-utilization arc used on the subscription panel.
export default function SeatGauge({ used = 0, limit = null }) {
  const pct = limit ? Math.min(1, used / limit) : 0;
  const r = 52;
  const circumference = Math.PI * r;
  const dashoffset = circumference * (1 - pct);

  const stroke = limit === null ? 'hsl(var(--primary))'
    : pct >= 1 ? 'hsl(var(--destructive))'
    : pct >= 0.7 ? 'hsl(var(--warning))'
    : 'hsl(var(--success))';

  return (
    <div className="relative w-[128px] h-[72px] flex-shrink-0">
      <svg viewBox="0 0 128 72" className="w-full h-full">
        <path
          d={`M 12 64 A ${r} ${r} 0 0 1 116 64`}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 12 64 A ${r} ${r} 0 0 1 116 64`}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <p className="text-xl font-bold leading-none">{used}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {limit === null ? 'unlimited' : `of ${limit} seats`}
        </p>
      </div>
    </div>
  );
}