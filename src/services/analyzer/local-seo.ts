import { CrawlResult } from '@/services/crawler/crawler';
import { SeoFinding } from '@/types';

export class LocalSeoAnalyzer {
  public static analyze(
    crawl: CrawlResult,
    leadId: string,
    auditId: string,
    businessName: string,
    city?: string | null,
    state?: string | null
  ): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const now = new Date().toISOString();

    // 1. Local Business Schema (JSON-LD)
    const hasLocalSchema =
      crawl.rawHtml.includes('"@type": "LocalBusiness"') ||
      crawl.rawHtml.includes('"@type":"LocalBusiness"') ||
      crawl.rawHtml.includes('schema.org/LocalBusiness') ||
      crawl.rawHtml.includes('schema.org/HVACBusiness') ||
      crawl.rawHtml.includes('schema.org/Dentist') ||
      crawl.rawHtml.includes('schema.org/LegalService') ||
      crawl.rawHtml.includes('schema.org/HomeAndConstructionBusiness') ||
      crawl.rawHtml.includes('schema.org/Plumber');

    if (!hasLocalSchema) {
      findings.push({
        id: `f-local-schema-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Local SEO',
        check_name: 'LocalBusiness Schema Markup',
        status: 'fail',
        score_impact: 18,
        title: 'Missing Structured LocalBusiness JSON-LD Schema',
        description: 'Structured schema data helps Google associate physical service locations, opening hours, reviews, and geo-coordinates.',
        evidence: 'No LocalBusiness or niche schema (Dentist, Plumber, HVACBusiness, LegalService) found in page source.',
        recommendation: 'Implement schema.org JSON-LD LocalBusiness markup with NAP, geo-coordinates, hours, and service list.',
        created_at: now,
      });
    } else {
      findings.push({
        id: `f-local-schema-pass-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Local SEO',
        check_name: 'LocalBusiness Schema Markup',
        status: 'pass',
        score_impact: 0,
        title: 'LocalBusiness Schema Detected',
        description: 'Structured data is implemented to support local Google graph indexing.',
        evidence: 'Detected schema.org LocalBusiness markup in document.',
        recommendation: 'Periodically validate schema using Google Rich Results Test tool.',
        created_at: now,
      });
    }

    // 2. Click-to-Call Phone Availability (Essential for Mobile Local Leads)
    const hasClickToCall = crawl.extractedNap.phones.length > 0 && crawl.rawHtml.includes('href="tel:');
    if (!hasClickToCall) {
      findings.push({
        id: `f-local-tel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Local SEO',
        check_name: 'Click-to-Call Phone Number',
        status: 'warning',
        score_impact: 12,
        title: 'Missing Click-to-Call "tel:" Links in Header/Navigation',
        description: 'Mobile visitors want to tap and call immediately. Plain text phone numbers add friction.',
        evidence: 'No active <a href="tel:..."> phone links detected in header or navigation.',
        recommendation: 'Add a sticky click-to-call phone button prominently in the header for mobile users.',
        created_at: now,
      });
    }

    // 3. Location & City Mentions (Local Relevance)
    if (city) {
      const cityMentioned = crawl.bodyText.toLowerCase().includes(city.toLowerCase());
      if (!cityMentioned) {
        findings.push({
          id: `f-local-city-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'Local SEO',
          check_name: 'City & Service Area Targeting',
          status: 'warning',
          score_impact: 10,
          title: `Target City ("${city}") Not Mentioned on Homepage`,
          description: `Google Local algorithm relies on clear geographic signals. No prominent mentions of ${city} were found.`,
          evidence: `The keyword "${city}" does not appear in the homepage copy or headings.`,
          recommendation: `Incorporate "${city}" and surrounding neighborhoods into H1, H2s, body copy, and footer service area list.`,
          created_at: now,
        });
      }
    }

    // 4. Dedicated Location or Service Subpages
    const hasSubpages = crawl.internalLinks.length > 3;
    const hasLocationPages = crawl.internalLinks.some(
      (link) =>
        link.includes('/locations') ||
        link.includes('/service-area') ||
        link.includes('/areas-we-serve') ||
        link.includes('/city/')
    );

    if (!hasLocationPages && hasSubpages) {
      findings.push({
        id: `f-local-pages-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Local SEO',
        check_name: 'Service Area / Location Pages',
        status: 'info',
        score_impact: 6,
        title: 'No Dedicated Suburb / Service Area Pages Detected',
        description: 'Expanding into surrounding metro suburbs requires dedicated localized landing pages for higher Google Map Pack rankings.',
        evidence: `Internal links (${crawl.internalLinks.length} total) do not include /service-area or /locations pages.`,
        recommendation: 'Build 5-10 geo-targeted service area pages for nearby towns and zip codes.',
        created_at: now,
      });
    }

    return findings;
  }
}
