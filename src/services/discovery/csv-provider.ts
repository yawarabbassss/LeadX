import Papa from 'papaparse';
import { db } from '@/lib/db';
import { LeadInputData, DiscoveryResult, CsvColumnMapping } from './types';

// Normalized dictionary for automated CSV column header matching
const HEADER_PATTERNS: Record<keyof CsvColumnMapping, RegExp[]> = {
  business_name: [
    /^(business|company|organization|account|lead|client)?[\s_-]?(name|title)$/i,
    /^company$/i,
    /^business$/i,
    /^name$/i,
  ],
  website: [
    /^(website|url|site|web_page|domain|web)$/i,
    /^(company|business)?[\s_-]?(website|url|domain)$/i,
  ],
  category: [
    /^(category|industry|niche|sector|type|vertical|business[\s_-]?type)$/i,
  ],
  city: [/^(city|town|municipality)$/i, /^(location[\s_-]?city)$/i],
  state: [/^(state|province|region|st)$/i],
  country: [/^(country|nation)$/i],
  phone: [/^(phone|telephone|tel|mobile|cell|phone[\s_-]?number|contact[\s_-]?phone)$/i],
  email: [/^(email|e-mail|mail|email[\s_-]?address|contact[\s_-]?email)$/i],
  contact_name: [
    /^(contact|person|owner|decision[\s_-]?maker|full[\s_-]?name|contact[\s_-]?name|first[\s_-]?name)$/i,
  ],
  contact_role: [
    /^(role|title|position|job[\s_-]?title|contact[\s_-]?role|designation)$/i,
  ],
  notes: [/^(notes|note|comments|description|extra|memo)$/i],
};

export class CsvDiscoveryProvider {
  /**
   * Automatically detect column mappings from CSV headers
   */
  public static detectColumnMapping(headers: string[]): CsvColumnMapping {
    const mapping: Partial<CsvColumnMapping> = {};

    for (const key of Object.keys(HEADER_PATTERNS) as Array<keyof CsvColumnMapping>) {
      const patterns = HEADER_PATTERNS[key];
      const matchedHeader = headers.find((header) => {
        const cleaned = header.trim();
        return patterns.some((p) => p.test(cleaned));
      });

      if (matchedHeader) {
        mapping[key] = matchedHeader;
      }
    }

    return {
      business_name: mapping.business_name || headers[0] || 'business_name',
      website: mapping.website,
      category: mapping.category,
      city: mapping.city,
      state: mapping.state,
      country: mapping.country,
      phone: mapping.phone,
      email: mapping.email,
      contact_name: mapping.contact_name,
      contact_role: mapping.contact_role,
      notes: mapping.notes,
    };
  }

  /**
   * Parses CSV string, previews rows, and suggests mapping
   */
  public static parsePreview(csvContent: string): {
    headers: string[];
    sampleRows: any[];
    suggestedMapping: CsvColumnMapping;
    totalRows: number;
  } {
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      preview: 5,
    });

    const headers = (parsed.meta.fields || []).map((h) => h.trim());
    const suggestedMapping = this.detectColumnMapping(headers);

    return {
      headers,
      sampleRows: parsed.data as any[],
      suggestedMapping,
      totalRows: parsed.data.length,
    };
  }

  /**
   * Imports leads from parsed CSV with user-specified mapping
   */
  public static async importCsv(
    csvContent: string,
    mapping: CsvColumnMapping,
    defaultDefaults: { country?: string; category?: string } = {}
  ): Promise<DiscoveryResult> {
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as Record<string, string>[];
    const importedLeads = [];
    let duplicateCount = 0;
    const errors: Array<{ index: number; row?: any; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const businessName = row[mapping.business_name]?.trim();

      // If business name is missing, try fallback from website domain or skip
      let finalName = businessName;
      const rawWebsite = mapping.website ? row[mapping.website]?.trim() : '';

      if (!finalName && rawWebsite) {
        try {
          const u = new URL(rawWebsite.startsWith('http') ? rawWebsite : `https://${rawWebsite}`);
          finalName = u.hostname.replace('www.', '').split('.')[0];
          finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
        } catch {}
      }

      if (!finalName) {
        errors.push({
          index: i + 1,
          row,
          message: 'Missing business name or valid domain',
        });
        continue;
      }

      const leadData: LeadInputData = {
        business_name: finalName,
        website: rawWebsite || undefined,
        category: (mapping.category ? row[mapping.category]?.trim() : '') || defaultDefaults.category,
        city: mapping.city ? row[mapping.city]?.trim() : undefined,
        state: mapping.state ? row[mapping.state]?.trim() : undefined,
        country: (mapping.country ? row[mapping.country]?.trim() : '') || defaultDefaults.country || 'United States',
        phone: mapping.phone ? row[mapping.phone]?.trim() : undefined,
        email: mapping.email ? row[mapping.email]?.trim() : undefined,
        contact_name: mapping.contact_name ? row[mapping.contact_name]?.trim() : undefined,
        contact_role: mapping.contact_role ? row[mapping.contact_role]?.trim() : undefined,
        notes: mapping.notes ? row[mapping.notes]?.trim() : undefined,
      };

      try {
        const { lead, isNew } = await db.upsertLead(leadData);
        importedLeads.push(lead);
        if (!isNew) {
          duplicateCount++;
        }
      } catch (err: any) {
        errors.push({
          index: i + 1,
          row,
          message: err.message || 'Error inserting lead into database',
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
