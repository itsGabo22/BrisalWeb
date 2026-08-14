import type { Metadata } from 'next';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  return {
    // Bare title — the root layout's template appends the brand suffix.
    title: 'Política de Privacidad',
    description:
      'Conoce cómo Brisal by Salvador recopila, usa y protege tu información personal.',
  };
}

// Admin-editable — see the note in the terminos route.
export const dynamic = 'force-dynamic';

export default async function PrivacidadPage() {
  const config = await prisma.siteConfig.findUnique({
    where: { id: 'singleton' },
    select: { privacyPolicyText: true },
  });

  return (
    <LegalDocument
      title="Política de Privacidad"
      content={config?.privacyPolicyText}
    />
  );
}
