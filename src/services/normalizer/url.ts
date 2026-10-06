/**
 * Normalizes a website input string to a canonical domain and full URL.
 * Examples:
 *   "https://www.example.com/path" -> domain: "example.com", url: "https://example.com"
 *   "example.com" -> domain: "example.com", url: "https://example.com"
 *   "http://sub.domain.co.uk" -> domain: "sub.domain.co.uk", url: "http://sub.domain.co.uk"
 */
export function normalizeWebsite(rawUrl: string): { domain: string; url: string; isValid: boolean } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { domain: '', url: '', isValid: false };
  }

  let cleaned = rawUrl.trim();
  if (!cleaned) {
    return { domain: '', url: '', isValid: false };
  }

  // Add protocol if missing
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    let hostname = parsed.hostname.toLowerCase();

    // Strip www. prefix from domain normalization
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // Ensure basic domain format (contains at least one dot)
    if (!hostname.includes('.')) {
      return { domain: '', url: '', isValid: false };
    }

    const normalizedUrl = `${parsed.protocol}//${hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;

    return {
      domain: hostname,
      url: normalizedUrl,
      isValid: true,
    };
  } catch (err) {
    return { domain: '', url: '', isValid: false };
  }
}
