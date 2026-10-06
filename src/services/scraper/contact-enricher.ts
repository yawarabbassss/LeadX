import * as cheerio from 'cheerio';
import { normalizePhone, formatDisplayPhone } from '@/services/normalizer/phone';

export interface EnrichedContactData {
  emails: string[];
  phones: string[];
  contactName?: string | null;
  contactRole?: string | null;
  address?: string | null;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export class ContactEnricher {
  /**
   * Deeply crawls a website (homepage + contact/about/team subpages) to extract verified contact information
   */
  public static async enrichFromWebsite(targetUrl: string): Promise<EnrichedContactData> {
    const emails = new Set<string>();
    const phones = new Set<string>();
    let contactName: string | null = null;
    let contactRole: string | null = null;
    let address: string | null = null;
    const socialLinks: Record<string, string> = {};

    let normalized = targetUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      const parsedUrl = new URL(normalized);
      const origin = parsedUrl.origin;

      // 1. Fetch homepage
      const homepageHtml = await this.fetchHtml(normalized);
      if (homepageHtml) {
        this.extractDataFromHtml(homepageHtml, origin, emails, phones, socialLinks);

        // Check for owner / contact name in schema
        const nameData = this.extractPersonFromHtml(homepageHtml);
        if (nameData.name) {
          contactName = nameData.name;
          contactRole = nameData.role || 'Owner / Leadership';
        }
        if (nameData.address) {
          address = nameData.address;
        }

        // 2. Discover contact / about / team subpages to deep-scrape
        const subpagesToScrape = this.findContactSubpages(homepageHtml, origin);

        // Deep scrape up to 3 priority subpages in parallel
        await Promise.all(
          subpagesToScrape.slice(0, 3).map(async (subUrl) => {
            try {
              const subHtml = await this.fetchHtml(subUrl);
              if (subHtml) {
                this.extractDataFromHtml(subHtml, origin, emails, phones, socialLinks);
                const subNameData = this.extractPersonFromHtml(subHtml);
                if (!contactName && subNameData.name) {
                  contactName = subNameData.name;
                  contactRole = subNameData.role || 'Owner / Leadership';
                }
                if (!address && subNameData.address) {
                  address = subNameData.address;
                }
              }
            } catch {}
          })
        );
      }
    } catch (err) {
      console.warn(`Contact enricher error on ${targetUrl}:`, err);
    }

    // Filter invalid or dummy emails
    const validEmails = Array.from(emails).filter((email) => {
      const lower = email.toLowerCase();
      return (
        !lower.endsWith('.png') &&
        !lower.endsWith('.jpg') &&
        !lower.endsWith('.jpeg') &&
        !lower.endsWith('.webp') &&
        !lower.endsWith('.svg') &&
        !lower.includes('sentry') &&
        !lower.includes('wixpress') &&
        !lower.includes('example.com') &&
        !lower.includes('domain.com') &&
        !lower.includes('yourname')
      );
    });

    const validPhones = Array.from(phones).filter((p) => p.length >= 10);

    return {
      emails: validEmails.slice(0, 4),
      phones: validPhones.slice(0, 3),
      contactName,
      contactRole,
      address,
      socialLinks,
    };
  }

  private static async fetchHtml(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  private static extractDataFromHtml(
    html: string,
    origin: string,
    emails: Set<string>,
    phones: Set<string>,
    socialLinks: Record<string, string>
  ) {
    const $ = cheerio.load(html);

    // 1. Mailto links
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const clean = href.replace(/^mailto:/i, '').split('?')[0].trim();
        if (clean && clean.includes('@')) emails.add(clean.toLowerCase());
      }
    });

    // 2. Tel links
    $('a[href^="tel:"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const clean = href.replace(/^tel:/i, '').trim();
        const norm = normalizePhone(clean);
        if (norm) phones.add(norm);
      }
    });

    // 3. Regex in visible text
    $('script, style, noscript, svg').remove();
    const text = $('body').text().replace(/\s+/g, ' ');

    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    for (const e of emailMatches) {
      if (e.length < 60) emails.add(e.toLowerCase());
    }

    const phoneMatches = text.match(/(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}/g) || [];
    for (const p of phoneMatches) {
      const norm = normalizePhone(p);
      if (norm) phones.add(norm);
    }

    // 4. Social links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      if (href.includes('facebook.com/') && !socialLinks.facebook) socialLinks.facebook = href;
      if (href.includes('instagram.com/') && !socialLinks.instagram) socialLinks.instagram = href;
      if (href.includes('linkedin.com/') && !socialLinks.linkedin) socialLinks.linkedin = href;
      if ((href.includes('twitter.com/') || href.includes('x.com/')) && !socialLinks.twitter) socialLinks.twitter = href;
    });
  }

  private static extractPersonFromHtml(html: string): { name: string | null; role: string | null; address: string | null } {
    const $ = cheerio.load(html);
    let name: string | null = null;
    let role: string | null = null;
    let address: string | null = null;

    // Check JSON-LD Schema
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];

        for (const item of items) {
          if (item['@type'] === 'Person' && item.name && typeof item.name === 'string') {
            name = item.name;
            role = item.jobTitle || 'Executive';
          }
          if (item.founder && typeof item.founder.name === 'string') {
            name = item.founder.name;
            role = 'Founder';
          }
          if (item.employee && Array.isArray(item.employee) && item.employee[0]?.name) {
            name = item.employee[0].name;
            role = item.employee[0].jobTitle || 'Team Member';
          }
          if (item.address) {
            if (typeof item.address === 'string') address = item.address;
            else if (typeof item.address === 'object') {
              const street = item.address.streetAddress || '';
              const loc = item.address.addressLocality || '';
              const region = item.address.addressRegion || '';
              const zip = item.address.postalCode || '';
              address = `${street}, ${loc} ${region} ${zip}`.trim().replace(/^,\s*/, '');
            }
          }
        }
      } catch {}
    });

    // Check headings / team bios
    if (!name) {
      $('.team-member, .staff-member, .bio, .about-owner, [class*="team"]').each((_, el) => {
        const text = $(el).find('h2, h3, h4, .name, strong').first().text().trim();
        if (text && text.length > 3 && text.length < 35 && !text.toLowerCase().includes('team') && !text.toLowerCase().includes('about')) {
          name = text;
          role = 'Owner / Principal';
          return false;
        }
      });
    }

    return { name, role, address };
  }

  private static findContactSubpages(html: string, origin: string): string[] {
    const $ = cheerio.load(html);
    const subpages: string[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;

      const lower = href.toLowerCase();
      if (
        lower.includes('contact') ||
        lower.includes('about') ||
        lower.includes('team') ||
        lower.includes('staff') ||
        lower.includes('location')
      ) {
        try {
          const resolved = new URL(href, origin);
          if (resolved.origin === origin && !subpages.includes(resolved.href)) {
            subpages.push(resolved.href);
          }
        } catch {}
      }
    });

    return subpages;
  }
}
