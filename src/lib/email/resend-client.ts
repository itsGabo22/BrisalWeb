/**
 * Lazy Resend singleton, shared by every transactional email in the project.
 *
 * Extracted here because a third call site (wholesaler approval) was about to
 * paste the same six lines a third time. Behaviour is unchanged from the two
 * existing copies this replaces (contact form, wholesale registration
 * notification): construct once, only if `RESEND_API_KEY` is actually set, so
 * a local dev environment without the key never throws -- it just gets `null`
 * back and the caller falls through to a `console.log`.
 */
let resendClient: import('resend').Resend | null = null;

export function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend') as typeof import('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
