import { CrawlResult } from '@/services/crawler/crawler';
import { SeoFinding } from '@/types';

export class WebsiteQualityAnalyzer {
  public static analyze(crawl: CrawlResult, leadId: string, auditId: string): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const now = new Date().toISOString();

    // 1. Call to Action (CTA) & Conversion Structure
    const hasForm =
      crawl.rawHtml.includes('<form') ||
      crawl.rawHtml.includes('type="submit"') ||
      crawl.rawHtml.includes('contact-form') ||
      crawl.rawHtml.includes('gravityforms') ||
      crawl.rawHtml.includes('wpcf7');

    const hasBookingCta =
      crawl.rawHtml.toLowerCase().includes('book now') ||
      crawl.rawHtml.toLowerCase().includes('schedule') ||
      crawl.rawHtml.toLowerCase().includes('get a quote') ||
      crawl.rawHtml.toLowerCase().includes('free estimate') ||
      crawl.rawHtml.toLowerCase().includes('request appointment');

    if (!hasForm && !hasBookingCta) {
      findings.push({
        id: `f-qual-cta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Website Quality',
        check_name: 'Lead Capture & Call to Action (CTA)',
        status: 'warning',
        score_impact: 15,
        title: 'Potential Improvement Opportunity: Lead Capture CTA',
        description: 'The homepage lacks an immediate contact form, instant quote calculator, or prominent booking button above the fold.',
        evidence: 'No <form> element or primary "Book Now / Request Quote" button detected in page markup.',
        recommendation: 'Add a high-contrast hero CTA button ("Get a Free Estimate" or "Book Online") paired with a short contact form.',
        created_at: now,
      });
    }

    // 2. Trust Signals & Social Proof / Reviews
    const hasReviews =
      crawl.bodyText.toLowerCase().includes('review') ||
      crawl.bodyText.toLowerCase().includes('testimonial') ||
      crawl.bodyText.toLowerCase().includes('star rating') ||
      crawl.bodyText.toLowerCase().includes('what our clients say') ||
      crawl.rawHtml.includes('google-reviews') ||
      crawl.rawHtml.includes('yelp') ||
      crawl.rawHtml.includes('birdeye');

    if (!hasReviews) {
      findings.push({
        id: `f-qual-proof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Website Quality',
        check_name: 'Trust Signals & Customer Reviews',
        status: 'info',
        score_impact: 8,
        title: 'Potential Improvement Opportunity: Social Proof & Testimonials',
        description: 'Customer reviews and trust badges (e.g. BBB, 5-Star Google rating) significantly boost visitor conversion rates.',
        evidence: 'No customer testimonials, star ratings, or third-party review widgets detected on homepage.',
        recommendation: 'Embed verified Google customer reviews and industry accreditation badges to improve trust.',
        created_at: now,
      });
    }

    // 3. Navigation & User Experience
    if (crawl.internalLinks.length < 3 && !crawl.isPartial) {
      findings.push({
        id: `f-qual-nav-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Website Quality',
        check_name: 'Navigation & Service Breadth',
        status: 'warning',
        score_impact: 10,
        title: 'Potential Improvement Opportunity: Site Navigation Structure',
        description: 'Website appears to have a single-page layout or very limited navigation links.',
        evidence: `Only ${crawl.internalLinks.length} internal navigation link(s) discovered.`,
        recommendation: 'Expand header navigation to feature dedicated pages for individual services, case studies, and contact options.',
        created_at: now,
      });
    }

    // 4. Outdated Copyright / Design Age Signals
    const currentYear = new Date().getFullYear();
    const copyrightMatch = crawl.bodyText.match(/©\s*(?:20\d{2}-)?(20\d{2})/);
    if (copyrightMatch && copyrightMatch[1]) {
      const year = parseInt(copyrightMatch[1], 10);
      if (year < currentYear - 2) {
        findings.push({
          id: `f-qual-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'Website Quality',
          check_name: 'Footer Copyright & Maintenance Currency',
          status: 'info',
          score_impact: 5,
          title: `Potential Improvement Opportunity: Outdated Footer (${year})`,
          description: `Footer copyright shows ${year}, signaling to visitors that the website content may not be actively maintained.`,
          evidence: `Footer copyright reads: "© ${year}" (current year: ${currentYear}).`,
          recommendation: 'Update website copyright dynamically via JavaScript and review overall visual refresh.',
          created_at: now,
        });
      }
    }

    return findings;
  }
}
