import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  finalUrl: string;
  httpStatus: number;
  responseTimeMs: number;
  hasHttps: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  hasMobileViewport: boolean;
  hasSchema: boolean;
  isIndexable: boolean;
  canonicalUrl: string | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  headings: {
    h1s: string[];
    h2s: string[];
    h3s: string[];
    total: number;
  };
  imageCount: number;
  imagesWithoutAlt: number;
  imagesSampleWithoutAlt: string[];
  internalLinks: string[];
  externalLinks: string[];
  brokenLinksSample: string[];
  detectedTechnologies: string[];
  bodyText: string;
  rawHtml: string;
  extractedNap: {
    phones: string[];
    emails: string[];
    addresses: string[];
  };
  crawledAt: string;
  isPartial: boolean;
  errorMessage?: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (LeadX SEO Audit Engine)';

export class WebsiteCrawler {
  /**
   * Crawls a website URL safely with strict timeouts, redirects handling, and evidence extraction.
   */
  public static async crawl(targetUrl: string): Promise<CrawlResult> {
    const startTime = Date.now();
    let normalized = targetUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    const hasHttps = normalized.startsWith('https://');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(normalized, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;
      const httpStatus = response.status;
      const finalUrl = response.url || normalized;
      const rawHtml = await response.text();

      // Check robots.txt and sitemap.xml in parallel
      const domainUrl = new URL(finalUrl);
      const robotsUrl = `${domainUrl.protocol}//${domainUrl.host}/robots.txt`;
      const sitemapUrl = `${domainUrl.protocol}//${domainUrl.host}/sitemap.xml`;

      const [hasRobotsTxt, hasSitemap] = await Promise.all([
        this.checkFileExists(robotsUrl),
        this.checkFileExists(sitemapUrl),
      ]);

      // Parse HTML with Cheerio
      const $ = cheerio.load(rawHtml);

      // Meta Viewport
      const viewport = $('meta[name="viewport"]').attr('content');
      const hasMobileViewport = !!(viewport && viewport.includes('width=device-width'));

      // Title & Description
      const title = $('title').text().trim() || null;
      const metaDescription =
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        null;

      // Canonical
      const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;

      // Indexability (meta robots)
      const robotsMeta = $('meta[name="robots"]').attr('content') || '';
      const isIndexable = !robotsMeta.toLowerCase().includes('noindex');

      // Headings
      const h1s: string[] = [];
      $('h1').each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text) h1s.push(text);
      });

      const h2s: string[] = [];
      $('h2').each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text) h2s.push(text);
      });

      const h3s: string[] = [];
      $('h3').each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (text) h3s.push(text);
      });

      const h1 = h1s[0] || null;
      const headingCount = h1s.length + h2s.length + h3s.length;

      // Images and Alt tags
      let imageCount = 0;
      let imagesWithoutAlt = 0;
      const imagesSampleWithoutAlt: string[] = [];

      $('img').each((_, el) => {
        imageCount++;
        const alt = $(el).attr('alt');
        const src = $(el).attr('src') || '';
        if (alt === undefined || alt.trim() === '') {
          imagesWithoutAlt++;
          if (imagesSampleWithoutAlt.length < 5 && src) {
            imagesSampleWithoutAlt.push(src.slice(0, 100));
          }
        }
      });

      // Links extraction (Internal vs External)
      const internalLinks: string[] = [];
      const externalLinks: string[] = [];
      const currentHost = domainUrl.hostname.toLowerCase().replace('www.', '');

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href')?.trim();
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        try {
          const resolved = new URL(href, finalUrl);
          const linkHost = resolved.hostname.toLowerCase().replace('www.', '');

          if (linkHost === currentHost) {
            if (!internalLinks.includes(resolved.href) && internalLinks.length < 60) {
              internalLinks.push(resolved.href);
            }
          } else {
            if (!externalLinks.includes(resolved.href) && externalLinks.length < 30) {
              externalLinks.push(resolved.href);
            }
          }
        } catch {}
      });

      // Structured Data / Schema check
      let hasSchema = false;
      $('script[type="application/ld+json"]').each((_, el) => {
        const content = $(el).html();
        if (content && (content.includes('@context') || content.includes('schema.org'))) {
          hasSchema = true;
        }
      });
      if (!hasSchema && $('[itemscope]').length > 0) {
        hasSchema = true;
      }

      // Technology detection
      const detectedTechnologies: string[] = [];
      if (rawHtml.includes('wp-content') || rawHtml.includes('wp-includes')) {
        detectedTechnologies.push('WordPress');
      }
      if (rawHtml.includes('elementor')) {
        detectedTechnologies.push('Elementor');
      }
      if (rawHtml.includes('wix.com') || rawHtml.includes('wix-image')) {
        detectedTechnologies.push('Wix');
      }
      if (rawHtml.includes('squarespace.com') || rawHtml.includes('Static.SQUARESPACE')) {
        detectedTechnologies.push('Squarespace');
      }
      if (rawHtml.includes('cdn.shopify.com')) {
        detectedTechnologies.push('Shopify');
      }
      if (rawHtml.includes('google-analytics.com') || rawHtml.includes('googletagmanager.com')) {
        detectedTechnologies.push('Google Analytics/GTM');
      }
      if (rawHtml.includes('bootstrap') || rawHtml.includes('bootstrapcdn')) {
        detectedTechnologies.push('Bootstrap');
      }
      if (rawHtml.includes('tailwind')) {
        detectedTechnologies.push('Tailwind CSS');
      }

      // Body text extraction (stripped of scripts and styles)
      $('script, style, noscript, svg').remove();
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

      // Extract Phone, Email, Addresses from text and hrefs
      const extractedPhones: string[] = [];
      const extractedEmails: string[] = [];
      const extractedAddresses: string[] = [];

      $('a[href^="tel:"]').each((_, el) => {
        const tel = $(el).attr('href')?.replace('tel:', '').trim();
        if (tel && !extractedPhones.includes(tel)) extractedPhones.push(tel);
      });

      $('a[href^="mailto:"]').each((_, el) => {
        const mail = $(el).attr('href')?.replace('mailto:', '').split('?')[0].trim();
        if (mail && !extractedEmails.includes(mail)) extractedEmails.push(mail);
      });

      // Regex matches in text
      const phoneMatches = bodyText.match(/(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g) || [];
      for (const p of phoneMatches) {
        if (!extractedPhones.includes(p) && extractedPhones.length < 5) extractedPhones.push(p);
      }

      const emailMatches = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      for (const e of emailMatches) {
        if (!extractedEmails.includes(e) && extractedEmails.length < 5) extractedEmails.push(e);
      }

      // US State/Zip address pattern
      const addressMatch = bodyText.match(/\b\d{1,5}\s+[\w\s.,#]{3,35},\s*([A-Z]{2}|[A-Za-z]+)\s+\d{5}\b/);
      if (addressMatch) {
        extractedAddresses.push(addressMatch[0]);
      }

      return {
        url: targetUrl,
        finalUrl,
        httpStatus,
        responseTimeMs,
        hasHttps,
        hasRobotsTxt,
        hasSitemap,
        hasMobileViewport,
        hasSchema,
        isIndexable,
        canonicalUrl,
        title,
        metaDescription,
        h1,
        headings: {
          h1s,
          h2s,
          h3s,
          total: headingCount,
        },
        imageCount,
        imagesWithoutAlt,
        imagesSampleWithoutAlt,
        internalLinks,
        externalLinks,
        brokenLinksSample: [],
        detectedTechnologies,
        bodyText: bodyText.slice(0, 10000),
        rawHtml: rawHtml.slice(0, 150000),
        extractedNap: {
          phones: extractedPhones,
          emails: extractedEmails,
          addresses: extractedAddresses,
        },
        crawledAt: new Date().toISOString(),
        isPartial: false,
      };
    } catch (err: any) {
      // Partial crawl fallback when network request is blocked or times out
      console.warn(`Crawl encountered partial error for ${targetUrl}:`, err.message);
      return {
        url: targetUrl,
        finalUrl: normalized,
        httpStatus: 0,
        responseTimeMs: Date.now() - startTime,
        hasHttps,
        hasRobotsTxt: false,
        hasSitemap: false,
        hasMobileViewport: true,
        hasSchema: false,
        isIndexable: true,
        canonicalUrl: null,
        title: null,
        metaDescription: null,
        h1: null,
        headings: { h1s: [], h2s: [], h3s: [], total: 0 },
        imageCount: 0,
        imagesWithoutAlt: 0,
        imagesSampleWithoutAlt: [],
        internalLinks: [],
        externalLinks: [],
        brokenLinksSample: [],
        detectedTechnologies: [],
        bodyText: '',
        rawHtml: '',
        extractedNap: { phones: [], emails: [], addresses: [] },
        crawledAt: new Date().toISOString(),
        isPartial: true,
        errorMessage: err.name === 'AbortError' ? 'Website connection timed out (>9s)' : err.message,
      };
    }
  }

  private static async checkFileExists(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.status >= 200 && res.status < 400;
    } catch {
      return false;
    }
  }
}
