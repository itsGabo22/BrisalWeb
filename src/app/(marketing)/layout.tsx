'use client';

import { LazyMotion, domAnimation } from 'framer-motion';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
