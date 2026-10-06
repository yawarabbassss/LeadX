import { CrawlResult } from '@/services/crawler/crawler';
import { SeoFinding } from '@/types';

export class TechnicalSeoAnalyzer {
  public static analyze(crawl: CrawlResult, leadId: string, auditId: string): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const now = new Date().toISOString();

    // 1. HTTPS Security
    if (!crawl.hasHttps || crawl.finalUrl.startsWith('http://')) {
      findings.push({
        id: `f-tech-https-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'HTTPS Encryption & Redirect',
        status: 'fail',
        score_impact: 15,
        title: 'Missing HTTPS SSL Encryption or Insecure Redirect',
        description: 'The website is served over insecure HTTP or does not properly enforce HTTPS redirects.',
        evidence: `Visited URL redirected to: ${crawl.finalUrl} (HTTPS: ${crawl.hasHttps ? 'Yes' : 'No'})`,
        recommendation: 'Install an SSL certificate and configure 301 redirects from HTTP to HTTPS across all pages.',
        created_at: now,
      });
    } else {
      findings.push({
        id: `f-tech-https-pass-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'HTTPS Security',
        status: 'pass',
        score_impact: 0,
        title: 'HTTPS SSL Enabled',
        description: 'Website is securely served over HTTPS.',
        evidence: `Secure connection verified at ${crawl.finalUrl}`,
        recommendation: 'Keep SSL certificate auto-renewal active.',
        created_at: now,
      });
    }

    // 2. XML Sitemap
    if (!crawl.hasSitemap) {
      findings.push({
        id: `f-tech-sitemap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'XML Sitemap Availability',
        status: 'warning',
        score_impact: 10,
        title: 'Missing XML Sitemap',
        description: 'No XML sitemap was found at /sitemap.xml to assist search engines in discovering all pages.',
        evidence: `HTTP GET to /sitemap.xml returned 404 or was unreachable.`,
        recommendation: 'Generate an automated XML sitemap and submit it to Google Search Console.',
        created_at: now,
      });
    }

    // 3. Robots.txt
    if (!crawl.hasRobotsTxt) {
      findings.push({
        id: `f-tech-robots-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'Robots.txt File',
        status: 'warning',
        score_impact: 5,
        title: 'Missing robots.txt File',
        description: 'Standard /robots.txt file was not detected.',
        evidence: `GET /robots.txt returned non-200 status.`,
        recommendation: 'Create a robots.txt file to guide search crawlers away from admin/private directories.',
        created_at: now,
      });
    }

    // 4. Mobile Viewport Meta Tag
    if (!crawl.hasMobileViewport) {
      findings.push({
        id: `f-tech-viewport-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'Mobile Responsive Viewport',
        status: 'fail',
        score_impact: 20,
        title: 'Missing Mobile Viewport Meta Tag',
        description: 'The webpage does not specify a responsive viewport width, hurting mobile usability and mobile-first indexing.',
        evidence: 'HTML head is missing <meta name="viewport" content="width=device-width, initial-scale=1">.',
        recommendation: 'Add the standard viewport meta tag and verify responsive mobile styling across all breakpoints.',
        created_at: now,
      });
    }

    // 5. Canonical URL
    if (!crawl.canonicalUrl) {
      findings.push({
        id: `f-tech-canonical-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'Canonical Tag',
        status: 'warning',
        score_impact: 6,
        title: 'Missing Canonical Tag',
        description: 'Homepage does not define a rel="canonical" link to prevent duplicate content indexing.',
        evidence: 'No <link rel="canonical"> tag found in page <head>.',
        recommendation: 'Implement self-referential canonical tags on all indexable pages.',
        created_at: now,
      });
    }

    // 6. Image Alt Attributes
    if (crawl.imageCount > 0 && crawl.imagesWithoutAlt > 0) {
      const percentage = Math.round((crawl.imagesWithoutAlt / crawl.imageCount) * 100);
      findings.push({
        id: `f-tech-imgalt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'Image Alt Text Coverage',
        status: percentage > 40 ? 'warning' : 'info',
        score_impact: percentage > 40 ? 8 : 4,
        title: `${crawl.imagesWithoutAlt} of ${crawl.imageCount} Images Missing Alt Text (${percentage}%)`,
        description: 'Images without descriptive alt text harm accessibility and miss image SEO ranking opportunities.',
        evidence: `Detected ${crawl.imagesWithoutAlt} unlabelled images. Samples: ${crawl.imagesSampleWithoutAlt.slice(0, 2).join(', ') || 'N/A'}`,
        recommendation: 'Add descriptive, keyword-relevant alt attributes to all content and service photos.',
        created_at: now,
      });
    }

    // 7. Page Response Speed Indicator
    if (crawl.responseTimeMs > 1500) {
      findings.push({
        id: `f-tech-speed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'Technical SEO',
        check_name: 'Server Response Time',
        status: 'warning',
        score_impact: 8,
        title: `Slow Server Initial Response Time (${crawl.responseTimeMs}ms)`,
        description: 'The server took over 1.5 seconds to return the HTML document, which degrades Core Web Vitals (TTFB).',
        evidence: `Measured Time to First Byte / response delivery: ${crawl.responseTimeMs}ms (ideal is <500ms).`,
        recommendation: 'Enable server caching, optimize database queries, or switch to a high-performance hosting provider.',
        created_at: now,
      });
    }

    return findings;
  }
}
