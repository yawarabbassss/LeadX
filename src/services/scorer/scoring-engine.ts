import { WebsiteAudit, SeoFinding, LeadScore, LeadCategory, ServiceType } from '@/types';

export interface LeadScoringInput {
  leadId: string;
  businessName: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  audit?: WebsiteAudit | null;
  findings: SeoFinding[];
}

export class LeadScoringEngine {
  public static calculate(input: LeadScoringInput): {
    score: LeadScore;
    category: LeadCategory;
    primaryService: ServiceType;
  } {
    const { leadId, audit, findings, phone, email, contactName, category: industry } = input;

    // 1. Website Opportunity (0–25)
    let websiteOpportunity = 0;
    const websiteReasons: string[] = [];

    if (!audit?.has_mobile_viewport) {
      websiteOpportunity += 10;
      websiteReasons.push('Missing mobile viewport configuration (+10)');
    }
    const qualityFindings = findings.filter((f) => f.category === 'Website Quality' && (f.status === 'fail' || f.status === 'warning'));
    if (qualityFindings.some((f) => f.check_name.includes('CTA') || f.check_name.includes('Lead Capture'))) {
      websiteOpportunity += 8;
      websiteReasons.push('Missing direct CTA / lead capture form (+8)');
    }
    if (audit && audit.response_time_ms && audit.response_time_ms > 1200) {
      websiteOpportunity += 4;
      websiteReasons.push(`Slow server response time (${audit.response_time_ms}ms) (+4)`);
    }
    if (audit && audit.internal_links_count < 4) {
      websiteOpportunity += 3;
      websiteReasons.push('Minimal internal site structure (+3)');
    }
    websiteOpportunity = Math.min(25, websiteOpportunity);
    if (websiteReasons.length === 0) {
      websiteOpportunity = 5;
      websiteReasons.push('Baseline modern website structure');
    }

    // 2. SEO Opportunity (0–25)
    let seoOpportunity = 0;
    const seoReasons: string[] = [];

    const techAndOnPageFails = findings.filter(
      (f) => (f.category === 'Technical SEO' || f.category === 'On-Page SEO') && (f.status === 'fail' || f.status === 'warning')
    );

    if (techAndOnPageFails.some((f) => f.check_name.includes('Title'))) {
      seoOpportunity += 7;
      seoReasons.push('Title tag missing or unoptimized (+7)');
    }
    if (techAndOnPageFails.some((f) => f.check_name.includes('Meta Description'))) {
      seoOpportunity += 5;
      seoReasons.push('Meta description missing or invalid length (+5)');
    }
    if (techAndOnPageFails.some((f) => f.check_name.includes('H1'))) {
      seoOpportunity += 6;
      seoReasons.push('H1 heading missing or generic (+6)');
    }
    if (!audit?.has_sitemap) {
      seoOpportunity += 4;
      seoReasons.push('Missing XML sitemap (+4)');
    }
    if (audit && audit.images_without_alt > 0) {
      seoOpportunity += 3;
      seoReasons.push(`${audit.images_without_alt} images missing alt tags (+3)`);
    }
    seoOpportunity = Math.min(25, seoOpportunity);
    if (seoReasons.length === 0) {
      seoOpportunity = 4;
      seoReasons.push('Fundamental SEO meta tags present');
    }

    // 3. Local SEO Opportunity (0–20)
    let localSeoOpportunity = 0;
    const localReasons: string[] = [];

    const localFindings = findings.filter((f) => f.category === 'Local SEO');
    if (!audit?.has_schema || localFindings.some((f) => f.check_name.includes('Schema') && f.status === 'fail')) {
      localSeoOpportunity += 10;
      localReasons.push('Missing LocalBusiness JSON-LD schema (+10)');
    }
    if (localFindings.some((f) => f.check_name.includes('tel') || f.check_name.includes('Phone'))) {
      localSeoOpportunity += 6;
      localReasons.push('No click-to-call mobile header links (+6)');
    }
    if (localFindings.some((f) => f.check_name.includes('City') || f.check_name.includes('Location'))) {
      localSeoOpportunity += 4;
      localReasons.push('Weak localized city/neighborhood targeting (+4)');
    }
    localSeoOpportunity = Math.min(20, localSeoOpportunity);
    if (localReasons.length === 0) {
      localSeoOpportunity = 4;
      localReasons.push('Standard local business signals detected');
    }

    // 4. Business Potential (0–15)
    let businessPotential = 8; // Baseline for operating business
    const businessReasons: string[] = [];

    const highTicketIndustries = [
      'hvac',
      'dental',
      'dentist',
      'legal',
      'lawyer',
      'attorney',
      'roofing',
      'plumbing',
      'remodel',
      'contractor',
      'real estate',
      'medical',
      'cosmetic',
    ];

    if (industry && highTicketIndustries.some((k) => industry.toLowerCase().includes(k))) {
      businessPotential += 5;
      businessReasons.push(`High customer lifetime value industry: ${industry} (+5)`);
    } else {
      businessPotential += 2;
      businessReasons.push('Commercial service sector (+2)');
    }

    if (audit && audit.http_status === 200) {
      businessPotential += 2;
      businessReasons.push('Active web domain & business presence (+2)');
    }
    businessPotential = Math.min(15, businessPotential);

    // 5. Contactability (0–15)
    let contactability = 0;
    const contactReasons: string[] = [];

    if (phone) {
      contactability += 6;
      contactReasons.push('Direct telephone number available (+6)');
    }
    if (email) {
      contactability += 5;
      contactReasons.push('Direct email address identified (+5)');
    }
    if (contactName) {
      contactability += 4;
      contactReasons.push(`Decision maker contact identified (${contactName}) (+4)`);
    }
    if (contactability === 0) {
      contactReasons.push('No verified direct contact details yet (+0)');
    }
    contactability = Math.min(15, contactability);

    // Total Deterministic Score (0–100)
    const total_score = websiteOpportunity + seoOpportunity + localSeoOpportunity + businessPotential + contactability;

    // Lead Category
    let leadCategory: LeadCategory = 'LOW';
    if (total_score >= 80) {
      leadCategory = 'HOT';
    } else if (total_score >= 60) {
      leadCategory = 'WARM';
    } else if (total_score >= 40) {
      leadCategory = 'POTENTIAL';
    }

    // Determine Primary Service Recommendation
    let primaryService: ServiceType = 'Website + SEO';
    const hasWebsiteMajorFlaw = !audit?.has_mobile_viewport || websiteOpportunity >= 18;
    const hasLocalMajorFlaw = localSeoOpportunity >= 14;
    const hasSeoMajorFlaw = seoOpportunity >= 16;

    if (hasWebsiteMajorFlaw && hasSeoMajorFlaw) {
      primaryService = 'Website + SEO';
    } else if (hasWebsiteMajorFlaw) {
      primaryService = 'Website Redesign';
    } else if (hasLocalMajorFlaw) {
      primaryService = 'Local SEO';
    } else if (hasSeoMajorFlaw) {
      primaryService = 'On-Page SEO';
    } else if (!audit?.has_sitemap || !audit?.has_robots_txt || (audit?.response_time_ms && audit.response_time_ms > 1400)) {
      primaryService = 'Technical SEO';
    } else {
      primaryService = 'SEO Audit';
    }

    const scoreRecord: LeadScore = {
      id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      lead_id: leadId,
      total_score,
      website_opportunity: websiteOpportunity,
      seo_opportunity: seoOpportunity,
      local_seo_opportunity: localSeoOpportunity,
      business_potential: businessPotential,
      contactability,
      breakdown_json: {
        website_opportunity: {
          category: 'Website Opportunity',
          max_score: 25,
          awarded_score: websiteOpportunity,
          reasons: websiteReasons,
        },
        seo_opportunity: {
          category: 'SEO Opportunity',
          max_score: 25,
          awarded_score: seoOpportunity,
          reasons: seoReasons,
        },
        local_seo_opportunity: {
          category: 'Local SEO Opportunity',
          max_score: 20,
          awarded_score: localSeoOpportunity,
          reasons: localReasons,
        },
        business_potential: {
          category: 'Business Potential',
          max_score: 15,
          awarded_score: businessPotential,
          reasons: businessReasons,
        },
        contactability: {
          category: 'Contactability',
          max_score: 15,
          awarded_score: contactability,
          reasons: contactReasons,
        },
      },
      created_at: new Date().toISOString(),
    };

    return {
      score: scoreRecord,
      category: leadCategory,
      primaryService,
    };
  }
}
