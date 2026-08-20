'use client';

import * as React from 'react';

// Vicar's own credit badge — a common "developed by" convention on client
// sites. The blue-to-cyan gradient and wordmark are Vicar's brand identity,
// deliberately left unskinned from Brisal's gold palette.
export function DeveloperCredit() {
  const gradientId = React.useId();

  return (
    <a
      href="https://vicardev.digital/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Vicar — desarrollo web"
      className="flex flex-col items-center gap-1 text-brand-text-soft opacity-80 transition-all duration-300 hover:-translate-y-0.5 hover:opacity-100"
    >
      <span className="font-body text-[10px] font-normal tracking-[0.2em] text-brand-text-soft uppercase">
        Developed by
      </span>
      <svg
        width="110"
        height="35"
        viewBox="0 0 320 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="max-w-[140px] text-brand-text-soft"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <path
          d="M15 20 L45 50 L15 80"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="55"
          y="75"
          fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
          fontWeight="800"
          fontSize="60"
          fill="currentColor"
          letterSpacing="-2"
        >
          VICAR
        </text>
        <rect
          x="275"
          y="20"
          width="8"
          height="60"
          transform="rotate(20 275 50)"
          fill={`url(#${gradientId})`}
          rx="4"
        />
      </svg>
    </a>
  );
}
