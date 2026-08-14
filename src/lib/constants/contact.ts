/**
 * The business's real contact details, in one place.
 *
 * These were previously duplicated as private consts in the footer AND the
 * contact page AND hardcoded into the privacy policy — three copies of
 * `contacto@brisalbysalvador.com` and `+57 300 000 0000`, both placeholders,
 * which is how they survived to production. One module means the next change
 * is one edit.
 *
 * NOT in SiteConfig: this is not something the client edits per-deploy, and a
 * DB round-trip on every footer render would be a cost with no payoff. If it
 * ever needs to be client-editable, it moves there wholesale.
 */

export const CONTACT_EMAIL = 'salvadorhoyosjoyeria@gmail.com';

/** National format, as the client gave it. */
export const CONTACT_PHONE = '3170275417';
/** Display form — grouped for readability, never used as an href. */
export const CONTACT_PHONE_DISPLAY = '+57 317 027 5417';
/**
 * E.164 without the `+`, which is what `tel:` and `wa.me` both want.
 *
 * This is the SAME number as `NEXT_PUBLIC_WHATSAPP_NUMBER`, which drives the
 * floating button, the checkout hand-off and the product-page CTA. They are
 * still two separate values on purpose: the WhatsApp destination is an env var
 * so it can be repointed per environment without a deploy, and that convention
 * predates this file (see the note in WhatsAppButton.tsx). If they ever drift,
 * the env var is the one that decides where an ORDER goes.
 */
export const CONTACT_PHONE_E164 = '573170275417';

export const CONTACT_ADDRESS_LINES = [
  'Centro Comercial Galerías',
  'Carrera 26 # 18-71',
  'Pasto, Nariño, Colombia',
] as const;

export const CONTACT_ADDRESS = CONTACT_ADDRESS_LINES.join(', ');

/**
 * Social profiles the business actually uses.
 *
 * Facebook was removed rather than left pointing at `#`: the footer shipped
 * three icons all href="#", and a dead Facebook link is worse than no Facebook
 * icon — it looks like a broken site to anyone who clicks it.
 */
export const SOCIAL_PROFILES = [
  {
    label: 'Instagram',
    handle: '@brisalaccesorios',
    href: 'https://instagram.com/brisalaccesorios',
  },
  {
    label: 'TikTok',
    handle: '@brisal.col',
    href: 'https://www.tiktok.com/@brisal.col',
  },
] as const;
