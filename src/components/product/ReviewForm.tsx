'use client';

import * as React from 'react';
import { ImagePlus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StarPicker } from '@/components/ui/star-rating';
import { MAX_REVIEW_BODY, MAX_REVIEW_IMAGES } from '@/lib/validators';

interface ReviewFormProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  /** Fired after a successful submit, so the parent can show the thank-you. */
  onSubmitted: () => void;
}

interface Attachment {
  file: File;
  url: string;
}

export function ReviewForm({
  productId,
  productName,
  isOpen,
  onClose,
  onSubmitted,
}: ReviewFormProps) {
  const [authorName, setAuthorName] = React.useState('');
  const [rating, setRating] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Blob URLs are minted per pick and revoked together on unmount, rather than
  // in an effect per attachment — the list is at most four items.
  React.useEffect(() => {
    return () => {
      for (const attachment of attachments) URL.revokeObjectURL(attachment.url);
    };
  }, [attachments]);

  const reset = () => {
    setAuthorName('');
    setRating(0);
    setTitle('');
    setBody('');
    setAttachments([]);
    setError(null);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked = Array.from(fileList).filter((file) => file.type.startsWith('image/'));
    setAttachments((current) => {
      const room = MAX_REVIEW_IMAGES - current.length;
      if (room <= 0) return current;
      const added = picked.slice(0, room).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      return [...current, ...added];
    });
    // Clearing lets the same file be re-picked after being removed.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (url: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.url !== url));
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (authorName.trim().length < 2) {
      setError('Escribe tu nombre.');
      return;
    }
    if (rating < 1) {
      setError('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    setIsSubmitting(true);

    // multipart rather than JSON: the photos travel in the same request, so
    // there is no half-submitted review with orphaned uploads behind it.
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('authorName', authorName.trim());
    formData.append('rating', String(rating));
    formData.append('title', title.trim());
    formData.append('body', body.trim());
    for (const attachment of attachments) formData.append('images', attachment.file);

    try {
      const res = await fetch('/api/reviews', { method: 'POST', body: formData });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'No se pudo enviar la reseña');
      }
      reset();
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escribir una reseña"
      description={productName}
      className="max-w-lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="review-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Enviar reseña'}
          </Button>
        </div>
      }
    >
      <form id="review-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <span className="text-brand-text font-body text-sm font-medium">
            Tu calificación *
          </span>
          <StarPicker value={rating} onChange={setRating} invalid={Boolean(error) && rating < 1} />
        </div>

        <Input
          label="Tu nombre *"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Ej. María G."
          maxLength={60}
          autoComplete="name"
        />

        <Input
          label="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Hermoso y de buena calidad"
          maxLength={120}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label
            htmlFor="review-body"
            className="text-brand-text font-body text-sm font-medium"
          >
            Tu reseña (opcional)
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_REVIEW_BODY))}
            rows={4}
            placeholder="Cuéntanos qué te pareció…"
            className="border-brand-line bg-brand-pearl text-brand-text placeholder:text-brand-text-soft/60 focus-visible:ring-brand-gold focus-visible:border-brand-gold w-full rounded-md border px-3 py-2 text-base transition-colors focus-visible:ring-2 focus-visible:outline-none sm:text-sm"
          />
          <span className="text-brand-text-soft/70 self-end font-body text-[11px] tabular-nums">
            {body.length}/{MAX_REVIEW_BODY}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-brand-text font-body text-sm font-medium">
            Fotos (opcional, máx. {MAX_REVIEW_IMAGES})
          </span>

          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.url}
                className="border-brand-line relative size-20 overflow-hidden rounded-md border"
              >
                {/* Local blob: URLs bypass next/image's optimizer by design. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.url)}
                  aria-label="Quitar foto"
                  className="bg-brand-text/70 absolute top-1 right-1 flex size-5 items-center justify-center rounded-full text-white transition-colors hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {attachments.length < MAX_REVIEW_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-brand-line text-brand-text-soft hover:border-brand-gold hover:text-brand-gold-deep flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed transition-colors"
              >
                <ImagePlus size={18} />
                <span className="font-body text-[10px]">Agregar</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {error && (
          <p className="font-body text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Said before they submit, not only after: a shopper who expects their
            review to appear instantly and doesn't see it will assume it broke. */}
        <p className="border-brand-line text-brand-text-soft border-t pt-4 font-body text-xs leading-relaxed">
          Tu reseña será revisada por nuestro equipo antes de publicarse.
        </p>
      </form>
    </Modal>
  );
}
