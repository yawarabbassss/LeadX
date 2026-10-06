import { db } from '@/lib/db';
import { normalizeWebsite } from '@/services/normalizer/url';
import { DiscoveryResult, LeadInputData } from './types';

export class UrlDiscoveryProvider {
  /**
   * Parse a single or batch list of URLs/pasted text lines
   */
  public static parseLines(rawText: string): LeadInputData[] {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: LeadInputData[] = [];

    for (const line of lines) {
      // Check if line contains a URL
      const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
      const urlMatch = line.match(urlRegex);

      if (urlMatch) {
        const rawUrl = urlMatch[0];
        const { domain, url, isValid } = normalizeWebsite(rawUrl);

        if (isValid) {
          // Remove URL from line to see if business name/city was provided
          let remainingText = line.replace(rawUrl, '').replace(/[|\-,:]+/g, ' ').trim();

          let businessName = '';
          let city = '';
          let state = '';

          if (remainingText.length > 2) {
            const parts = remainingText.split(/\s{2,}|\t/).filter(Boolean);
            if (parts.length >= 2) {
              businessName = parts[0].trim();
              city = parts[1].trim();
            } else {
              businessName = remainingText;
            }
          }

          if (!businessName) {
            // Derive clean business name from domain: "austin-ac-repair.com" -> "Austin Ac Repair"
            const namePart = domain.split('.')[0];
            businessName = namePart
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase());
          }

          parsed.push({
            business_name: businessName,
            website: url,
            city: city || undefined,
            state: state || undefined,
            country: 'United States',
          });
        }
      }
    }

    return parsed;
  }

  public static async discoverFromInput(
    rawText: string,
    defaults: { category?: string; city?: string; state?: string } = {}
  ): Promise<DiscoveryResult> {
    const items = this.parseLines(rawText);
    const importedLeads = [];
    let duplicateCount = 0;
    const errors: Array<{ index: number; row?: any; message: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const { lead, isNew } = await db.upsertLead({
          ...item,
          category: defaults.category || item.category,
          city: item.city || defaults.city,
          state: item.state || defaults.state,
        });
        importedLeads.push(lead);
        if (!isNew) duplicateCount++;
      } catch (err: any) {
        errors.push({
          index: i + 1,
          row: item,
          message: err.message || 'Failed to insert URL lead',
        });
      }
    }

    return {
      leads: importedLeads,
      importedCount: importedLeads.length - duplicateCount,
      duplicateCount,
      errors,
    };
  }
}
