'use client';

import * as React from 'react';
import { useScroll } from 'framer-motion';

type PageScrollValue = ReturnType<typeof useScroll>;

const PageScrollContext = React.createContext<PageScrollValue | null>(null);

export function PageScrollProvider({ children }: { children: React.ReactNode }) {
  const scroll = useScroll();

  return React.createElement(
    PageScrollContext.Provider,
    { value: scroll },
    children,
  );
}

export function usePageScroll(): PageScrollValue {
  const context = React.useContext(PageScrollContext);

  if (!context) {
    throw new Error('usePageScroll must be used within PageScrollProvider');
  }

  return context;
}
