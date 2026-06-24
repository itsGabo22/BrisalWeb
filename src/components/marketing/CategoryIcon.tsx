'use client';

import * as React from 'react';
import Image from 'next/image';

interface CategoryIconProps {
  slug: string;
  name: string;
  fallbackEmoji: string;
}

export function CategoryIcon({ slug, name, fallbackEmoji }: CategoryIconProps) {
  const [hasError, setHasError] = React.useState(false);
  const iconPath = `/icons/categories/cat-${slug}.png`;

  if (hasError) {
    return (
      <span className="select-none" aria-hidden="true">
        {fallbackEmoji}
      </span>
    );
  }

  return (
    <Image
      src={iconPath}
      alt={name}
      width={40}
      height={40}
      className="h-10 w-10 object-contain transition-transform group-hover:scale-110"
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}
