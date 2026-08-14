'use client';

import * as React from 'react';
import { ExternalLink, Scale, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SiteConfigData {
  termsAndConditionsText: string | null;
  privacyPolicyText: string | null;
}

const FIELDS = [
  {
    key: 'termsAndConditionsText',
    label: 'Términos y Condiciones',
    href: '/legal/terminos',
    id: 'legal-terms',
  },
  {
    key: 'privacyPolicyText',
    label: 'Política de Privacidad',
    href: '/legal/privacidad',
    id: 'legal-privacy',
  },
] as const;

/**
 * The two legal documents, as plain textareas.
 *
 * A rich-text or markdown editor was considered and rejected: this admin has no
 * editor component anywhere (every other long field — the banner, the video
 * section body — is a bare textarea), so introducing one library for these two
 * fields would make Legal the odd panel out and add a dependency for it. The
 * supported syntax is small enough to explain in the two lines of help below.
 */
export function LegalSection() {
  const [config, setConfig] = React.useState<SiteConfigData | null>(null);
  const [terms, setTerms] = React.useState('');
  const [privacy, setPrivacy] = React.useState('');

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyConfig = React.useCallback((next: SiteConfigData) => {
    setConfig(next);
    setTerms(next.termsAndConditionsText ?? '');
    setPrivacy(next.privacyPolicyText ?? '');
  }, []);

  const loadConfig = React.useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site-config');
      if (res.ok) applyConfig((await res.json()) as SiteConfigData);
    } catch (err) {
      console.error('Error loading site config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyConfig]);

  React.useEffect(() => {
    void Promise.resolve().then(() => loadConfig());
  }, [loadConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);

    // Only the two legal columns are sent; everything else on the singleton is
    // absent, and the route treats a missing field as "leave it alone".
    const formData = new FormData();
    formData.append('termsAndConditionsText', terms);
    formData.append('privacyPolicyText', privacy);

    try {
      const res = await fetch('/api/admin/site-config', { method: 'PATCH', body: formData });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(payload.error ?? 'Error al guardar los textos legales');
      }
      applyConfig((await res.json()) as SiteConfigData);
      setSavedMsg('Guardado correctamente.');
      setTimeout(() => setSavedMsg(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsSaving(false);
    }
  };

  const value = (key: (typeof FIELDS)[number]['key']) =>
    key === 'termsAndConditionsText' ? terms : privacy;
  const setValue = (key: (typeof FIELDS)[number]['key'], next: string) =>
    key === 'termsAndConditionsText' ? setTerms(next) : setPrivacy(next);

  const hasChanges =
    terms !== (config?.termsAndConditionsText ?? '') ||
    privacy !== (config?.privacyPolicyText ?? '');

  return (
    <div className="rounded-xl border border-brand-neutral-200 bg-white p-6 shadow-sm dark:border-brand-neutral-800 dark:bg-brand-neutral-900">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-neutral-900 dark:text-brand-neutral-50">
        <Scale className="size-5 text-brand-gold" />
        <span>Legal</span>
      </h2>
      <p className="mt-1 font-sans text-xs text-brand-neutral-400">
        El texto de las páginas «Términos y Condiciones» y «Política de
        Privacidad». Se publica en el sitio apenas guardas.
      </p>

      {isLoading ? (
        <div className="mt-6 flex h-48 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-4 border-brand-gold border-t-transparent" />
        </div>
      ) : (
        <div className="mt-6 space-y-6 font-sans text-sm">
          {/* Moved here from the public pages, where it used to sit in an amber
              box above the document itself. It is advice for the client, not
              for shoppers — and it would have been actively misleading once
              these texts are reviewed and approved. */}
          <div
            role="note"
            className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-400">
              <strong className="font-semibold">Esto no es asesoría legal.</strong>{' '}
              Los textos actuales son un borrador de referencia. Antes de
              considerarlos definitivos, pídele a un abogado que los revise y
              ajuste a tu operación real.
            </p>
          </div>

          {FIELDS.map((field) => (
            <div key={field.key}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label
                  htmlFor={field.id}
                  className="block font-medium text-brand-neutral-700 dark:text-brand-neutral-300"
                >
                  {field.label}
                </label>
                <a
                  href={field.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-brand-gold-deep transition-colors hover:text-brand-gold"
                >
                  Ver página
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <textarea
                id={field.id}
                rows={14}
                value={value(field.key)}
                onChange={(e) => setValue(field.key, e.target.value)}
                placeholder={`Escribe aquí el texto de «${field.label}»…`}
                className="w-full rounded border border-brand-neutral-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-brand-neutral-850 focus:ring-1 focus:ring-brand-gold focus:outline-none dark:border-brand-neutral-800 dark:bg-brand-neutral-950 dark:text-brand-neutral-100"
              />
              <p className="mt-1 text-[11px] text-brand-neutral-400">
                {value(field.key).trim().length === 0
                  ? 'Vacío: la página mostrará «Contenido en preparación».'
                  : `${value(field.key).trim().length.toLocaleString('es-CO')} caracteres.`}
              </p>
            </div>
          ))}

          <div className="rounded-lg border border-brand-neutral-100 bg-brand-neutral-50/60 px-4 py-3 text-[11px] leading-relaxed text-brand-neutral-500 dark:border-brand-neutral-800 dark:bg-brand-neutral-950/40">
            <strong className="font-semibold text-brand-neutral-600 dark:text-brand-neutral-300">
              Formato:
            </strong>{' '}
            deja una <strong>línea en blanco</strong> entre párrafos. Empieza una
            línea con <code className="text-brand-gold-deep">## </code> para un
            título de sección, y con{' '}
            <code className="text-brand-gold-deep">- </code> para una viñeta.
            Todo lo demás se muestra tal cual lo escribes.
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}
          {savedMsg && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{savedMsg}</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
