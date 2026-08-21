'use client';

import { useEffect, useState } from 'react';

export type WholesaleSessionStatus =
  | 'loading'
  | 'guest'
  | 'pending'
  | 'approved'
  /** Was approved, access since withdrawn by an admin. Prices as retail. */
  | 'revoked';

interface SessionResponse {
  authenticated: boolean;
  approved: boolean;
  revoked?: boolean;
}

/** Client-side wholesale session status, backed by GET /api/auth/session. */
export function useWholesaleSession(): WholesaleSessionStatus {
  const [status, setStatus] = useState<WholesaleSessionStatus>('loading');

  useEffect(() => {
    let active = true;

    fetch('/api/auth/session')
      .then((res) => (res.ok ? (res.json() as Promise<SessionResponse>) : null))
      .then((data) => {
        if (!active) return;
        if (!data?.authenticated) {
          setStatus('guest');
        } else if (data.approved) {
          setStatus('approved');
        } else if (data.revoked) {
          setStatus('revoked');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => {
        if (active) setStatus('guest');
      });

    return () => {
      active = false;
    };
  }, []);

  return status;
}
