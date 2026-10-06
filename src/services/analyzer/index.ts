import { CrawlResult } from '@/services/crawler/crawler';
import { SeoFinding, WebsiteAudit } from '@/types';
import { TechnicalSeoAnalyzer } from './technical-seo';
import { OnPageSeoAnalyzer } from './on-page-seo';
import { LocalSeoAnalyzer } from './local-seo';
import { WebsiteQualityAnalyzer } from './quality-analyzer';

export interface ComprehensiveAuditResult {
  audit: WebsiteAudit;
  findings: SeoFinding[];
}

export class WebsiteAuditEngine {
  public static runAudit(
    crawl: CrawlResult,
    leadId: string,
    leadInfo: { businessName: string; category?: string | null; city?: string | null; state?: string | null }
  ): ComprehensiveAuditResult {
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    // Run all 4 specialized analyzers
    const techFindings = TechnicalSeoAnalyzer.analyze(crawl, leadId, auditId);
    const onPageFindings = OnPageSeoAnalyzer.analyze(
      crawl,
      leadId,
      auditId,
      leadInfo.businessName,
      leadInfo.category,
      leadInfo.city
    );
    const localFindings = LocalSeoAnalyzer.analyze(
      crawl,
      leadId,
      auditId,
      leadInfo.businessName,
      leadInfo.city,
      leadInfo.state
    );
    const qualityFindings = WebsiteQualityAnalyzer.analyze(crawl, leadId, auditId);

    const allFindings = [...techFindings, ...onPageFindings, ...localFindings, ...qualityFindings];

    const audit: WebsiteAudit = {
      id: auditId,
      lead_id: leadId,
      url: crawl.url,
      final_url: crawl.finalUrl,
      http_status: crawl.httpStatus,
      response_time_ms: crawl.responseTimeMs,
      has_https: crawl.hasHttps,
      has_robots_txt: crawl.hasRobotsTxt,
      has_sitemap: crawl.hasSitemap,
      has_mobile_viewport: crawl.hasMobileViewport,
      has_schema: crawl.hasSchema,
      is_indexable: crawl.isIndexable,
      canonical_url: crawl.canonicalUrl,
      title: crawl.title,
      meta_description: crawl.metaDescription,
      h1: crawl.h1,
      heading_count: crawl.headings.total,
      image_count: crawl.imageCount,
      images_without_alt: crawl.imagesWithoutAlt,
      broken_links_sample: crawl.brokenLinksSample,
      internal_links_count: crawl.internalLinks.length,
      external_links_count: crawl.externalLinks.length,
      detected_technologies: crawl.detectedTechnologies,
      raw_signals: {
        isPartial: crawl.isPartial,
        errorMessage: crawl.errorMessage,
        nap: crawl.extractedNap,
      },
      created_at: now,
    };

    return {
      audit,
      findings: allFindings,
    };
  }
}

export * from './technical-seo';
export * from './on-page-seo';
export * from './local-seo';
export * from './quality-analyzer';
