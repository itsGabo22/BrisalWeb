import type { Metadata } from 'next';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  return {
    // Bare title: the root layout's metadata template already appends
    // " | Brisal by Salvador", so spelling it out here rendered it twice.
    title: 'Términos y Condiciones',
    description:
      'Lee los términos y condiciones de uso del catálogo y los servicios de Brisal by Salvador.',
  };
}

// The document is admin-editable, so it must not be baked into a static build —
// otherwise a clause the client edits stays stale until the next deploy.
export const dynamic = 'force-dynamic';

export default async function TerminosPage() {
  const config = await prisma.siteConfig.findUnique({
    where: { id: 'singleton' },
    select: { termsAndConditionsText: true },
  });

  return (
    <LegalDocument
      title="Términos y Condiciones"
      content={config?.termsAndConditionsText}
    />
  );
}
