'use client';

import * as React from 'react';

/**
 * A blob: URL for a picked File, revoked when the file changes or unmounts.
 *
 * Extracted because the hero slide modal needs the SAME pending upload in two
 * places at once — the upload card's thumbnail and the focal-point preview
 * frames — and each one minting its own URL for the same File would leak one
 * of them on every re-pick.
 */
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      void Promise.resolve().then(() => setUrl(null));
      return;
    }
    const next = URL.createObjectURL(file);
    void Promise.resolve().then(() => setUrl(next));
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return url;
}
