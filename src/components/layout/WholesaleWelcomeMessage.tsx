'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface SessionResponse {
  authenticated: boolean;
  approved: boolean;
  showWelcome: boolean;
  welcomeMessage: string | null;
}

/** Matches the admin panel's placeholder in WholesaleExtrasSection, so an
 * admin who never touches the field still gets a message that reads as
 * finished rather than as an empty box. */
const DEFAULT_MESSAGE =
  '¡Bienvenido/a! Ya puedes ver los precios mayoristas en todo el catálogo.';

/**
 * The one-time wholesale welcome message, shown the first time an approved
 * wholesaler's session loads after an admin approves them.
 *
 * Mounted in SiteChrome, so it checks on every storefront page load rather
 * than only right after the literal login redirect -- a wholesaler who logs
 * in and lands on /catalogo, then clicks straight through to a product page
 * before the check resolves, still sees it exactly once.
 *
 * `GET /api/auth/session` is the single source of truth for whether to show
 * it (`showWelcome`, gated server-side on `wholesaleWelcomeSeenAt === null`),
 * so this component does no gating logic of its own beyond "did the fetch say
 * yes." Dismissing POSTs to /api/auth/wholesale-welcome-seen, which is what
 * makes `showWelcome` false on every future check.
 */
export function WholesaleWelcomeMessage() {
  const [message, setMessage] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    fetch('/api/auth/session')
      .then((res) => (res.ok ? (res.json() as Promise<SessionResponse>) : null))
      .then((data) => {
        if (!active || !data?.showWelcome) return;
        setMessage(data.welcomeMessage?.trim() || DEFAULT_MESSAGE);
        setIsOpen(true);
      })
      .catch(() => {
        // Silent: a failed check just means no welcome banner this load. It
        // is not worth surfacing an error for a nice-to-have.
      });

    return () => {
      active = false;
    };
  }, []);

  const dismiss = () => {
    setIsOpen(false);
    // Fire-and-forget: even if this request fails, the worst case is the
    // message reappears on the NEXT page load, not a broken account state --
    // so there is nothing here worth blocking the close on or retrying.
    void fetch('/api/auth/wholesale-welcome-seen', { method: 'POST' }).catch(() => {});
  };

  if (!message) return null;

  return (
    <Modal isOpen={isOpen} onClose={dismiss} title="¡Cuenta mayorista aprobada!">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="bg-brand-gold/12 flex size-14 items-center justify-center rounded-full">
          <Sparkles className="text-brand-gold-deep size-7" />
        </span>
        <p className="text-brand-text-soft text-sm leading-relaxed whitespace-pre-line">
          {message}
        </p>
        <Button onClick={dismiss} className="mt-2 w-full sm:w-auto">
          Entendido
        </Button>
      </div>
    </Modal>
  );
}
