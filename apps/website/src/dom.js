/**
 * Safe DOM construction helpers.
 *
 * The retailer and checklist renderers used to build markup with
 * `innerHTML` and template interpolation. That is a stored-XSS sink: any
 * field that ever comes from the database (and later, from user input) can
 * inject script. These helpers build nodes instead, so every value lands as
 * text and can never be parsed as markup.
 */

/** Create an element, optionally with a class and text content. */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

/** Append a FontAwesome icon element. */
export function icon(faClass) {
  return el('i', `fa-solid ${faClass}`);
}

/**
 * Only allow http(s) links.
 *
 * Rejects `javascript:`, `data:`, `vbscript:` and anything else. Without
 * this an attacker-supplied URL becomes script execution on click.
 */
export function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * An external affiliate link.
 *
 * `noopener` severs `window.opener` (reverse tabnabbing); `noreferrer`
 * withholds the referrer; `sponsored` is the correct rel value for paid
 * links and satisfies the FTC's endorsement guidance.
 */
export function externalLink(href, className, label, iconClass) {
  const a = el('a', className);
  const url = safeUrl(href);
  if (!url) {
    // Render as plain text rather than an unclickable broken link.
    a.classList.add('opacity-50', 'cursor-not-allowed');
    a.textContent = String(label);
    return a;
  }
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer sponsored';
  a.appendChild(document.createTextNode(String(label)));
  if (iconClass) a.appendChild(icon(iconClass));
  return a;
}
