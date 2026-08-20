/**
 * HTML-escapes a value before it goes into an email body.
 *
 * The contact form and the wholesale-registration notifier both build their
 * HTML by interpolating submitted fields straight into a template string. React
 * escapes for the browser; a template literal escapes nothing, so a `nombre` of
 * `<img src=x onerror=…>` — or, more plausibly, a `mensaje` containing a stray
 * `<` — reached the client's inbox as live markup. It is not browser XSS (this
 * never renders on the site) but it is untrusted input rendered as HTML by
 * whatever mail client the client uses, and at minimum it silently mangles
 * legitimate messages that happen to contain angle brackets or ampersands.
 *
 * Escaping quotes as well as the three structural characters, because these
 * templates interpolate inside `style="…"` attributes in places.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
