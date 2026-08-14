import * as React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';

import { parseLegalText, hasLegalContent } from '@/lib/utils/legal-text';

interface LegalDocumentProps {
  title: string;
  /** Raw admin-authored text from SiteConfig. Null/blank shows the empty state. */
  content: string | null | undefined;
}

/**
 * Renders one admin-authored legal document.
 *
 * Shared by /legal/terminos and /legal/privacidad, which previously held two
 * near-identical copies of the same heading/section markup — the only real
 * difference between them was the words, which is exactly what now lives in the
 * database.
 *
 * The "revísalo con un abogado" draft notice these pages used to carry has
 * moved to the ADMIN editor. It is advice for the client, not for shoppers, and
 * once the client's lawyer has approved the text a notice calling it a draft is
 * worse than no notice at all.
 */
export function LegalDocument({ title, content }: LegalDocumentProps) {
  const blocks = hasLegalContent(content) ? parseLegalText(content as string) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <header className="mb-10">
        <h1 className="font-heading text-4xl font-medium text-brand-text">{title}</h1>
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-10 bg-brand-gold" />
          <span className="text-[10px] text-brand-gold">◆</span>
        </div>
      </header>

      {blocks.length > 0 ? (
        <div className="space-y-6 font-body text-brand-text-soft">
          {blocks.map((block, index) => {
            if (block.kind === 'heading') {
              return (
                <h2
                  key={index}
                  // `pt-4` on all but the first: headings need air above them,
                  // and the uniform space-y can't give one side more room.
                  className="pt-4 font-heading text-2xl font-medium text-brand-text first:pt-0"
                >
                  {block.text}
                </h2>
              );
            }

            if (block.kind === 'list') {
              return (
                <ul key={index} className="ml-5 list-disc space-y-2 text-sm leading-relaxed">
                  {block.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={index} className="text-sm leading-relaxed">
                {block.lines.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {line}
                  </React.Fragment>
                ))}
              </p>
            );
          })}
        </div>
      ) : (
        /* Graceful empty state. A legal route that 404s or renders blank looks
           broken and costs trust on exactly the page where trust is the point;
           this says the document is coming and keeps the visitor moving. */
        <div className="rounded-xl border border-brand-line bg-brand-pearl px-6 py-12 text-center">
          <FileText className="mx-auto size-8 text-brand-gold" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-medium text-brand-text">
            Contenido en preparación
          </h2>
          <p className="mx-auto mt-2 max-w-md font-body text-sm leading-relaxed text-brand-text-soft">
            Estamos terminando de redactar este documento. Si necesitas esta
            información ahora mismo, escríbenos y con gusto te la enviamos.
          </p>
          <Link
            href="/contacto"
            className="mt-6 inline-flex rounded-sm font-body text-sm text-brand-gold-deep underline underline-offset-4 transition-colors hover:text-brand-text focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
          >
            Contactar
          </Link>
        </div>
      )}
    </main>
  );
}
