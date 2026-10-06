import { CrawlResult } from '@/services/crawler/crawler';
import { SeoFinding } from '@/types';

export class OnPageSeoAnalyzer {
  public static analyze(
    crawl: CrawlResult,
    leadId: string,
    auditId: string,
    businessName: string,
    industry?: string | null,
    city?: string | null
  ): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const now = new Date().toISOString();

    // 1. Title Tag Quality
    if (!crawl.title) {
      findings.push({
        id: `f-onpage-title-missing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'Page Title Tag Presence',
        status: 'fail',
        score_impact: 20,
        title: 'Missing <title> Tag',
        description: 'The webpage has no title tag defined, which is the most critical on-page ranking factor.',
        evidence: 'HTML head contains no <title> element.',
        recommendation: `Add an optimized title tag: e.g., "${businessName} | ${industry || 'Services'} in ${city || 'Your City'}"`,
        created_at: now,
      });
    } else {
      const titleLen = crawl.title.length;
      if (titleLen < 25) {
        findings.push({
          id: `f-onpage-title-short-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'On-Page SEO',
          check_name: 'Title Tag Length & Depth',
          status: 'warning',
          score_impact: 10,
          title: `Title Tag Is Too Short (${titleLen} characters)`,
          description: 'Short title tags underutilize Google SERP real estate and fail to include primary service keywords.',
          evidence: `Current title: "${crawl.title}" (${titleLen} chars vs recommended 50-60 chars).`,
          recommendation: `Expand title to include primary services and location targeting.`,
          created_at: now,
        });
      } else if (titleLen > 65) {
        findings.push({
          id: `f-onpage-title-long-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'On-Page SEO',
          check_name: 'Title Tag Truncation',
          status: 'warning',
          score_impact: 5,
          title: `Title Tag Exceeds SERP Display Limit (${titleLen} characters)`,
          description: 'Titles longer than 60-65 characters get truncated in Google search results with ellipses.',
          evidence: `Current title: "${crawl.title.slice(0, 70)}..." (${titleLen} chars).`,
          recommendation: 'Condense title to under 60 characters while retaining primary target keywords.',
          created_at: now,
        });
      } else {
        findings.push({
          id: `f-onpage-title-good-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'On-Page SEO',
          check_name: 'Title Tag Optimization',
          status: 'pass',
          score_impact: 0,
          title: 'Well-Proportioned Title Tag',
          description: 'Title tag length is within the ideal 30-65 character range.',
          evidence: `Current title: "${crawl.title}" (${titleLen} characters).`,
          recommendation: 'Ensure target keywords match high-intent customer search queries.',
          created_at: now,
        });
      }
    }

    // 2. Meta Description Quality
    if (!crawl.metaDescription) {
      findings.push({
        id: `f-onpage-meta-missing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'Meta Description Tag',
        status: 'warning',
        score_impact: 12,
        title: 'Missing Meta Description Tag',
        description: 'Search engines are forced to generate snippets automatically, hurting click-through rate (CTR).',
        evidence: '<meta name="description"> tag is not present in document head.',
        recommendation: 'Write a compelling 140-160 character meta description featuring your unique value proposition and a clear CTA.',
        created_at: now,
      });
    } else {
      const metaLen = crawl.metaDescription.length;
      if (metaLen < 50 || metaLen > 175) {
        findings.push({
          id: `f-onpage-meta-length-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          audit_id: auditId,
          lead_id: leadId,
          category: 'On-Page SEO',
          check_name: 'Meta Description Length',
          status: 'warning',
          score_impact: 6,
          title: `Suboptimal Meta Description Length (${metaLen} characters)`,
          description: 'Meta description is outside the recommended 120-160 character window.',
          evidence: `Current meta description: "${crawl.metaDescription.slice(0, 100)}..." (${metaLen} chars).`,
          recommendation: 'Adjust description length to 140-160 characters for maximum search preview impact.',
          created_at: now,
        });
      }
    }

    // 3. H1 Heading Tag Analysis
    const genericH1s = ['home', 'welcome', 'home page', 'welcome to our website', 'main page', 'about us'];
    if (!crawl.h1) {
      findings.push({
        id: `f-onpage-h1-missing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'H1 Tag Presence',
        status: 'fail',
        score_impact: 16,
        title: 'Missing Primary H1 Tag',
        description: 'No <h1> heading was found on the homepage. The H1 is essential for establishing page topic relevance.',
        evidence: 'HTML parser found 0 <h1> elements.',
        recommendation: `Implement a clear H1 stating core service and location: e.g., "Top-Rated ${industry || 'Services'} in ${city || 'Your Area'}".`,
        created_at: now,
      });
    } else if (crawl.headings.h1s.length > 1) {
      findings.push({
        id: `f-onpage-h1-multiple-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'Multiple H1 Tags',
        status: 'warning',
        score_impact: 6,
        title: `Multiple H1 Headings Detected (${crawl.headings.h1s.length} found)`,
        description: 'Using multiple H1 tags can dilute semantic hierarchy and topic focus.',
        evidence: `Found H1s: ${crawl.headings.h1s.map((h) => `"${h}"`).join(' | ')}`,
        recommendation: 'Keep a single primary H1 per page and structure sub-topics using H2 and H3 tags.',
        created_at: now,
      });
    } else if (genericH1s.includes(crawl.h1.toLowerCase().trim())) {
      findings.push({
        id: `f-onpage-h1-generic-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'Generic Non-Descriptive H1',
        status: 'warning',
        score_impact: 12,
        title: `Generic H1 Heading ("${crawl.h1}")`,
        description: 'The primary headline is generic and conveys zero topical or commercial intent to search algorithms.',
        evidence: `Extracted H1: "${crawl.h1}"`,
        recommendation: 'Replace generic headline with a keyword-rich, value-focused statement.',
        created_at: now,
      });
    }

    // 4. Content Depth & Thin Content Check
    const wordCount = crawl.bodyText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 180) {
      findings.push({
        id: `f-onpage-thin-content-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        audit_id: auditId,
        lead_id: leadId,
        category: 'On-Page SEO',
        check_name: 'Content Depth / Thin Content',
        status: 'warning',
        score_impact: 12,
        title: `Thin Homepage Content (~${wordCount} words)`,
        description: 'Page contains limited body text, making it difficult for search engines to evaluate topical authority and relevance.',
        evidence: `Extracted visible body text contains only ~${wordCount} words.`,
        recommendation: 'Expand homepage copy to at least 500+ words covering services, processes, FAQs, and customer benefits.',
        created_at: now,
      });
    }

    return findings;
  }
}
