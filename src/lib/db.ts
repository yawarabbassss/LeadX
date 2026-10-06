import { Lead, WebsiteAudit, SeoFinding, LeadScore, AiAnalysis, OutreachMessage, LeadStatusHistory, LeadFilters, DashboardStats, LeadCategory, LeadStatus } from '@/types';
import { normalizeWebsite } from '@/services/normalizer/url';
import { normalizePhone } from '@/services/normalizer/phone';
import fs from 'fs';
import path from 'path';

// Local storage cache path for persistence when Supabase credentials are not yet configured
const LOCAL_DB_PATH = path.join(process.cwd(), '.local-db.json');

interface LocalDBState {
  leads: Lead[];
  audits: WebsiteAudit[];
  findings: SeoFinding[];
  scores: LeadScore[];
  analyses: AiAnalysis[];
  outreach: OutreachMessage[];
  statusHistory: LeadStatusHistory[];
}

function getInitialSeedData(): LocalDBState {
  const seedLeads: Lead[] = [
    {
      id: 'lead-us-001',
      business_name: 'Apex Heating & Air Conditioning',
      domain: 'apexheatingair.com',
      website: 'https://apexheatingair.com',
      category: 'HVAC',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      phone: '+15125550198',
      email: 'service@apexheatingair.com',
      contact_name: 'David Vance',
      contact_role: 'Operations Manager',
      notes: 'Family-owned HVAC business with 15 trucks. Active in South Austin.',
      lead_score: 88,
      lead_category: 'HOT',
      primary_service: 'Local SEO',
      status: 'Qualified',
      analysis_status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'lead-us-002',
      business_name: 'Precision Smile Dental Care',
      domain: 'precisionsmiledental.com',
      website: 'https://precisionsmiledental.com',
      category: 'Dental',
      city: 'Denver',
      state: 'CO',
      country: 'United States',
      phone: '+13035550144',
      email: 'info@precisionsmiledental.com',
      contact_name: 'Dr. Sarah Lin',
      contact_role: 'Owner / Principal Dentist',
      notes: 'High-end cosmetic & general dentistry. Modern office, but website is slow and non-responsive on mobile.',
      lead_score: 92,
      lead_category: 'HOT',
      primary_service: 'Website Redesign',
      status: 'New',
      analysis_status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: 'lead-us-003',
      business_name: 'Vanguard Legal Group',
      domain: 'vanguardlawgroup.com',
      website: 'https://vanguardlawgroup.com',
      category: 'Legal',
      city: 'Phoenix',
      state: 'AZ',
      country: 'United States',
      phone: '+16025550182',
      email: 'contact@vanguardlawgroup.com',
      contact_name: 'Marcus Sterling',
      contact_role: 'Managing Partner',
      notes: 'Personal injury practice. Strong reputation, missing local schema and dedicated practice area pages.',
      lead_score: 76,
      lead_category: 'WARM',
      primary_service: 'Technical SEO',
      status: 'New',
      analysis_status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    },
    {
      id: 'lead-us-004',
      business_name: 'Summit Premier Roofing',
      domain: 'summitpremierroofing.com',
      website: 'https://summitpremierroofing.com',
      category: 'Roofing',
      city: 'Charlotte',
      state: 'NC',
      country: 'United States',
      phone: '+17045550119',
      email: 'quotes@summitpremierroofing.com',
      contact_name: 'Robert Hayes',
      contact_role: 'Owner',
      notes: 'Commercial and residential roofing contractor. No HTTPS redirect and missing alt tags.',
      lead_score: 64,
      lead_category: 'WARM',
      primary_service: 'Website + SEO',
      status: 'Contacted',
      analysis_status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'lead-us-005',
      business_name: 'BlueWave Plumbing & Drain',
      domain: 'bluewaveplumbingfl.com',
      website: 'https://bluewaveplumbingfl.com',
      category: 'Plumbing',
      city: 'Tampa',
      state: 'FL',
      country: 'United States',
      phone: '+18135550167',
      email: 'help@bluewaveplumbingfl.com',
      contact_name: 'Jason Alvarez',
      contact_role: 'General Manager',
      notes: 'Emergency plumbing services. 24/7 dispatch.',
      lead_score: 84,
      lead_category: 'HOT',
      primary_service: 'Local SEO',
      status: 'New',
      analysis_status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    }
  ];

  const seedAudits: WebsiteAudit[] = [
    {
      id: 'audit-001',
      lead_id: 'lead-us-001',
      url: 'https://apexheatingair.com',
      final_url: 'https://apexheatingair.com/',
      http_status: 200,
      response_time_ms: 640,
      has_https: true,
      has_robots_txt: true,
      has_sitemap: false,
      has_mobile_viewport: true,
      has_schema: false,
      is_indexable: true,
      canonical_url: 'https://apexheatingair.com/',
      title: 'Home | Apex Heating & Air',
      meta_description: 'Welcome to Apex Heating & Air Conditioning in Texas.',
      h1: 'Welcome to Our Website',
      heading_count: 6,
      image_count: 14,
      images_without_alt: 9,
      broken_links_sample: [],
      internal_links_count: 12,
      external_links_count: 2,
      detected_technologies: ['WordPress', 'Elementor'],
      raw_signals: {
        hasContactForm: true,
        hasPhoneInHeader: true,
        hasLocalAddress: true,
      },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'audit-002',
      lead_id: 'lead-us-002',
      url: 'https://precisionsmiledental.com',
      final_url: 'https://precisionsmiledental.com/',
      http_status: 200,
      response_time_ms: 1420,
      has_https: true,
      has_robots_txt: true,
      has_sitemap: true,
      has_mobile_viewport: false,
      has_schema: false,
      is_indexable: true,
      canonical_url: null,
      title: 'Precision Smile Dental Care - Denver Dentist',
      meta_description: '',
      h1: 'Comprehensive Dentistry',
      heading_count: 4,
      image_count: 22,
      images_without_alt: 18,
      broken_links_sample: ['https://precisionsmiledental.com/book-now'],
      internal_links_count: 8,
      external_links_count: 1,
      detected_technologies: ['Custom PHP', 'jQuery 1.11'],
      raw_signals: {
        hasContactForm: false,
        hasPhoneInHeader: true,
        hasLocalAddress: true,
      },
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    }
  ];

  const seedFindings: SeoFinding[] = [
    {
      id: 'f-001',
      audit_id: 'audit-001',
      lead_id: 'lead-us-001',
      category: 'Local SEO',
      check_name: 'LocalBusiness Schema',
      status: 'fail',
      score_impact: 18,
      title: 'Missing Structured LocalBusiness Schema',
      description: 'The website does not include schema.org LocalBusiness or HVACBusiness JSON-LD markup.',
      evidence: 'No JSON-LD or Microdata schema found for address, geo coordinates, or opening hours.',
      recommendation: 'Implement HVACBusiness schema with full NAP, opening hours, and service geo-radius.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'f-002',
      audit_id: 'audit-001',
      lead_id: 'lead-us-001',
      category: 'On-Page SEO',
      check_name: 'H1 Tag Quality',
      status: 'warning',
      score_impact: 12,
      title: 'Generic Non-Descriptive H1 Tag',
      description: 'The primary H1 tag lacks service keywords and location targeting.',
      evidence: 'H1 tag content is currently "Welcome to Our Website" instead of mentioning HVAC services in Austin.',
      recommendation: 'Update primary H1 to targeted headline: e.g., "Austin AC Repair & Heating Specialists".',
      created_at: new Date().toISOString(),
    },
    {
      id: 'f-003',
      audit_id: 'audit-001',
      lead_id: 'lead-us-001',
      category: 'Technical SEO',
      check_name: 'XML Sitemap',
      status: 'fail',
      score_impact: 10,
      title: 'Missing XML Sitemap',
      description: 'Standard sitemap.xml was not found at the root or referenced in robots.txt.',
      evidence: 'GET /sitemap.xml returned 404 Not Found.',
      recommendation: 'Generate an automatic XML sitemap and submit to Google Search Console.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'f-004',
      audit_id: 'audit-002',
      lead_id: 'lead-us-002',
      category: 'Website Quality',
      check_name: 'Mobile Viewport',
      status: 'fail',
      score_impact: 22,
      title: 'Missing Mobile Viewport Meta Tag',
      description: 'The page lacks a responsive viewport tag, resulting in broken layout on mobile devices.',
      evidence: '<meta name="viewport"> is missing from <head>. Page renders at desktop width on mobile.',
      recommendation: 'Rebuild website with modern responsive framework for seamless mobile booking.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'f-005',
      audit_id: 'audit-002',
      lead_id: 'lead-us-002',
      category: 'Website Quality',
      check_name: 'Broken Booking CTA',
      status: 'fail',
      score_impact: 20,
      title: 'Primary Call-to-Action Link is Broken',
      description: 'The main appointment booking link returns an error.',
      evidence: 'Link to /book-now returns HTTP 404, preventing patients from scheduling consultations.',
      recommendation: 'Fix booking flow and integrate direct online appointment scheduling.',
      created_at: new Date().toISOString(),
    }
  ];

  const seedScores: LeadScore[] = [
    {
      id: 'sc-001',
      lead_id: 'lead-us-001',
      total_score: 88,
      website_opportunity: 19,
      seo_opportunity: 23,
      local_seo_opportunity: 19,
      business_potential: 14,
      contactability: 13,
      breakdown_json: {
        website_opportunity: {
          category: 'Website Opportunity',
          max_score: 25,
          awarded_score: 19,
          reasons: ['Generic headline structure', '9 images missing alt tags', 'Outdated layout elements'],
        },
        seo_opportunity: {
          category: 'SEO Opportunity',
          max_score: 25,
          awarded_score: 23,
          reasons: ['Missing XML sitemap', 'Weak meta description', 'H1 lacks keyword/location targeting'],
        },
        local_seo_opportunity: {
          category: 'Local SEO Opportunity',
          max_score: 20,
          awarded_score: 19,
          reasons: ['Missing LocalBusiness JSON-LD schema', 'No dedicated neighborhood landing pages'],
        },
        business_potential: {
          category: 'Business Potential',
          max_score: 15,
          awarded_score: 14,
          reasons: ['Established HVAC contractor with 15 trucks', 'High-value customer lifetime value'],
        },
        contactability: {
          category: 'Contactability',
          max_score: 15,
          awarded_score: 13,
          reasons: ['Direct phone number available', 'Contact email identified', 'Decision maker role noted'],
        },
      },
      created_at: new Date().toISOString(),
    },
    {
      id: 'sc-002',
      lead_id: 'lead-us-002',
      total_score: 92,
      website_opportunity: 24,
      seo_opportunity: 21,
      local_seo_opportunity: 18,
      business_potential: 15,
      contactability: 14,
      breakdown_json: {
        website_opportunity: {
          category: 'Website Opportunity',
          max_score: 25,
          awarded_score: 24,
          reasons: ['Missing mobile viewport', 'Broken /book-now booking link', 'Slow page load (1.4s)'],
        },
        seo_opportunity: {
          category: 'SEO Opportunity',
          max_score: 25,
          awarded_score: 21,
          reasons: ['Empty meta description tag', '18 images without alt descriptions', 'Missing canonical tag'],
        },
        local_seo_opportunity: {
          category: 'Local SEO Opportunity',
          max_score: 20,
          awarded_score: 18,
          reasons: ['Missing DentalClinic schema markup', 'No dedicated cosmetic dentistry subpages'],
        },
        business_potential: {
          category: 'Business Potential',
          max_score: 15,
          awarded_score: 15,
          reasons: ['High-ticket cosmetic & implant dental procedures ($3,000+ case value)'],
        },
        contactability: {
          category: 'Contactability',
          max_score: 15,
          awarded_score: 14,
          reasons: ['Direct phone', 'Verified email', 'Named owner Dr. Sarah Lin'],
        },
      },
      created_at: new Date().toISOString(),
    }
  ];

  const seedAnalyses: AiAnalysis[] = [
    {
      id: 'ai-001',
      lead_id: 'lead-us-001',
      audit_id: 'audit-001',
      lead_summary: 'Apex Heating & Air Conditioning is an established residential & commercial HVAC provider in Austin, TX with clear local search growth potential.',
      qualification_reason: 'Established multi-technician service business with strong local demand, but missing critical LocalBusiness schema, XML sitemap, and localized heading architecture.',
      primary_service: 'Local SEO',
      secondary_service: 'On-Page SEO',
      pain_points: [
        'No LocalBusiness schema markup detected on homepage or contact page',
        'Primary H1 is generic ("Welcome to Our Website") rather than targeting Austin HVAC keywords',
        'Missing sitemap.xml to index emergency repair service pages'
      ],
      evidence: [
        'Verified lack of JSON-LD schema in page source',
        'Raw H1 header extracted: "Welcome to Our Website"',
        'GET /sitemap.xml returned 404'
      ],
      recommended_pitch_angle: 'Offer a focused Local SEO & Google visibility tune-up highlighting the missing schema and localized keyword architecture that lets local competitors capture high-intent emergency searches.',
      personalized_message: 'Hey David, I came across Apex Heating & Air while researching HVAC contractors in Austin.\n\nI took a quick look at apexheatingair.com and noticed that the homepage H1 tag is currently set to "Welcome to Our Website" rather than targeting Austin AC/heating keywords, and the site is missing structured LocalBusiness schema.\n\nThat looks like an immediate opportunity because Austin homeowners searching for emergency repairs will find competitors who have those local signals configured.\n\nI help HVAC businesses dial in their local SEO and technical setup to capture more service calls. If you\'d like, I can send over a quick 2-minute video breakdown of what I found.',
      confidence: 0.94,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ai-002',
      lead_id: 'lead-us-002',
      audit_id: 'audit-002',
      lead_summary: 'Precision Smile Dental Care is a premier cosmetic dental practice in Denver losing mobile patient bookings due to responsive formatting and broken links.',
      qualification_reason: 'High patient lifetime value practice suffering from broken booking CTA (/book-now returning 404) and missing mobile viewport meta tags.',
      primary_service: 'Website Redesign',
      secondary_service: 'Technical SEO',
      pain_points: [
        'Main appointment booking CTA link (/book-now) is currently broken (HTTP 404)',
        'No responsive viewport meta tag, causing the layout to clip on smartphones',
        'Empty meta description tag across core pages'
      ],
      evidence: [
        'Crawled link /book-now responded with status 404 Not Found',
        '<head> lacks <meta name="viewport"> tag',
        '<meta name="description"> tag is present but empty'
      ],
      recommended_pitch_angle: 'Directly address the revenue loss from mobile visitors and broken booking links, presenting a high-converting responsive redesign.',
      personalized_message: 'Hey Dr. Sarah, I came across Precision Smile Dental Care while looking at dental practices in Denver.\n\nI was browsing your website on mobile and noticed that the main "Book Now" button is currently leading to a 404 error page, and the mobile viewport isn\'t scaling correctly for smartphone visitors.\n\nFor a cosmetic practice where each new patient is worth thousands in lifetime care, having broken appointment links on mobile is directly costing consultations.\n\nI specialize in building fast, high-converting websites for dental practices. If you\'d like, I\'d be happy to show you a quick fix for the booking flow.',
      confidence: 0.96,
      created_at: new Date().toISOString(),
    }
  ];

  const seedOutreach: OutreachMessage[] = [
    {
      id: 'out-001',
      lead_id: 'lead-us-001',
      variation_type: 'standard',
      tone: 'conversational',
      subject: 'Quick observation on apexheatingair.com',
      message_body: 'Hey David, I came across Apex Heating & Air while researching HVAC contractors in Austin.\n\nI took a quick look at apexheatingair.com and noticed that the homepage H1 tag is currently set to "Welcome to Our Website" rather than targeting Austin AC/heating keywords, and the site is missing structured LocalBusiness schema.\n\nThat looks like an immediate opportunity because Austin homeowners searching for emergency repairs will find competitors who have those local signals configured.\n\nI help HVAC businesses dial in their local SEO and technical setup to capture more service calls. If you\'d like, I can send over a quick 2-minute video breakdown of what I found.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'out-002',
      lead_id: 'lead-us-001',
      variation_type: 'short',
      tone: 'concise',
      subject: 'Apex Heating & Air - Austin SEO note',
      message_body: 'Hey David, noticed apexheatingair.com has a generic H1 headline and missing local schema markup. Fixing those two items would give you an immediate boost in Austin emergency HVAC searches. Happy to send over the details if you\'re interested.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'out-003',
      lead_id: 'lead-us-001',
      variation_type: 'direct',
      tone: 'direct',
      subject: 'Local SEO gap on apexheatingair.com',
      message_body: 'David, your website is missing structured LocalBusiness schema and sitemap.xml, which prevents Google from indexing your full service area across Austin. We optimize local search architecture for HVAC contractors. Let me know if you\'d like me to send over our audit notes.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'out-004',
      lead_id: 'lead-us-001',
      variation_type: 'email',
      tone: 'professional',
      subject: 'Quick audit findings for Apex Heating & Air (Austin)',
      message_body: 'Hi David,\n\nI was researching established HVAC providers in the Austin area and took a look at apexheatingair.com.\n\nI ran a quick technical check and spotted three specific areas holding back your local search visibility:\n1. Missing LocalBusiness schema markup\n2. Generic H1 heading ("Welcome to Our Website")\n3. Missing XML sitemap\n\nResolving these allows Google to properly associate your service trucks with high-intent Austin searches.\n\nWould you be open to a quick 5-minute walkthrough of what we found?\n\nBest,\nProspecting Team',
      created_at: new Date().toISOString(),
    }
  ];

  return {
    leads: seedLeads,
    audits: seedAudits,
    findings: seedFindings,
    scores: seedScores,
    analyses: seedAnalyses,
    outreach: seedOutreach,
    statusHistory: [],
  };
}

class DatabaseService {
  private state: LocalDBState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LocalDBState {
    try {
      if (fs.existsSync(LOCAL_DB_PATH)) {
        const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Could not read local DB, initializing seed data:', err);
    }
    const seed = getInitialSeedData();
    this.persistState(seed);
    return seed;
  }

  private persistState(state: LocalDBState) {
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local DB to disk:', err);
    }
  }

  // ==========================================
  // LEADS CRUD & QUERIES
  // ==========================================

  public async getLeads(filters: LeadFilters = {}): Promise<{ leads: Lead[]; total: number }> {
    let result = [...this.state.leads];

    // Query search (business name, domain, city, email, contact name)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          l.domain.toLowerCase().includes(q) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.state && l.state.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
          (l.category && l.category.toLowerCase().includes(q))
      );
    }

    // Score range
    if (filters.minScore !== undefined) {
      result = result.filter((l) => l.lead_score >= filters.minScore!);
    }
    if (filters.maxScore !== undefined) {
      result = result.filter((l) => l.lead_score <= filters.maxScore!);
    }

    // Category
    if (filters.category && filters.category !== 'ALL') {
      result = result.filter((l) => l.lead_category === filters.category);
    }

    // Industry / Category
    if (filters.industry && filters.industry !== 'ALL') {
      result = result.filter(
        (l) => l.category && l.category.toLowerCase() === filters.industry!.toLowerCase()
      );
    }

    // Service Opportunity
    if (filters.primaryService && filters.primaryService !== 'ALL') {
      result = result.filter(
        (l) => l.primary_service && l.primary_service.toLowerCase() === filters.primaryService!.toLowerCase()
      );
    }

    // CRM Status
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((l) => l.status === filters.status);
    }

    // Contact availability filters
    if (filters.hasEmail) {
      result = result.filter((l) => !!l.email);
    }
    if (filters.hasPhone) {
      result = result.filter((l) => !!l.phone);
    }
    if (filters.hasWebsite) {
      result = result.filter((l) => !!l.website);
    }

    // Analysis status
    if (filters.analysisStatus && filters.analysisStatus !== 'ALL') {
      result = result.filter((l) => l.analysis_status === filters.analysisStatus);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_desc';
    result.sort((a, b) => {
      if (sortBy === 'score_desc') return b.lead_score - a.lead_score;
      if (sortBy === 'score_asc') return a.lead_score - b.lead_score;
      if (sortBy === 'name_asc') return a.business_name.localeCompare(b.business_name);
      if (sortBy === 'updated_desc') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Attach related details
    const hydratedLeads = result.map((lead) => this.hydrateLead(lead));

    return { leads: hydratedLeads, total: hydratedLeads.length };
  }

  public async getLeadById(id: string): Promise<Lead | null> {
    const lead = this.state.leads.find((l) => l.id === id);
    if (!lead) return null;
    return this.hydrateLead(lead);
  }

  private hydrateLead(lead: Lead): Lead {
    const audit = this.state.audits.find((a) => a.lead_id === lead.id) || null;
    const findings = this.state.findings.filter((f) => f.lead_id === lead.id);
    const score_details = this.state.scores.find((s) => s.lead_id === lead.id) || null;
    const ai_analysis = this.state.analyses.find((ai) => ai.lead_id === lead.id) || null;
    const outreach_messages = this.state.outreach.filter((o) => o.lead_id === lead.id);
    const status_history = this.state.statusHistory.filter((h) => h.lead_id === lead.id);

    return {
      ...lead,
      audit,
      findings,
      score_details,
      ai_analysis,
      outreach_messages,
      status_history,
    };
  }

  /**
   * Finds existing lead by duplicate matching criteria:
   * 1. Normalized Domain (e.g. example.com)
   * 2. Phone number
   * 3. Email
   * 4. Business name + City
   */
  public findDuplicate(data: {
    domain?: string;
    phone?: string;
    email?: string;
    business_name?: string;
    city?: string;
  }): Lead | null {
    const normDomain = data.domain ? data.domain.toLowerCase().trim() : '';
    const normPhone = data.phone ? normalizePhone(data.phone) : '';
    const normEmail = data.email ? data.email.toLowerCase().trim() : '';
    const normName = data.business_name ? data.business_name.toLowerCase().trim() : '';
    const normCity = data.city ? data.city.toLowerCase().trim() : '';

    return (
      this.state.leads.find((l) => {
        if (normDomain && l.domain && l.domain.toLowerCase() === normDomain) return true;
        if (normEmail && l.email && l.email.toLowerCase() === normEmail) return true;
        if (normPhone && l.phone && normalizePhone(l.phone) === normPhone) return true;
        if (
          normName &&
          normCity &&
          l.business_name.toLowerCase() === normName &&
          l.city &&
          l.city.toLowerCase() === normCity
        ) {
          return true;
        }
        return false;
      }) || null
    );
  }

  public async upsertLead(input: Partial<Lead> & { business_name: string }): Promise<{ lead: Lead; isNew: boolean }> {
    const { domain, url } = normalizeWebsite(input.website || input.domain || '');
    const normPhone = input.phone ? normalizePhone(input.phone) : (input.phone || null);
    const normEmail = input.email ? input.email.toLowerCase().trim() : (input.email || null);

    const existing = this.findDuplicate({
      domain: domain || input.domain || undefined,
      phone: normPhone || undefined,
      email: normEmail || undefined,
      business_name: input.business_name,
      city: input.city || undefined,
    });

    const now = new Date().toISOString();

    if (existing) {
      // Update existing lead with newly provided fields without overwriting completed audit/score
      const updatedLead: Lead = {
        ...existing,
        business_name: input.business_name || existing.business_name,
        domain: domain || existing.domain,
        website: url || input.website || existing.website,
        category: input.category !== undefined ? input.category : existing.category,
        city: input.city !== undefined ? input.city : existing.city,
        state: input.state !== undefined ? input.state : existing.state,
        country: input.country || existing.country || 'United States',
        phone: normPhone !== undefined ? normPhone : existing.phone,
        email: normEmail !== undefined ? normEmail : existing.email,
        contact_name: input.contact_name !== undefined ? input.contact_name : existing.contact_name,
        contact_role: input.contact_role !== undefined ? input.contact_role : existing.contact_role,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updated_at: now,
      };

      const index = this.state.leads.findIndex((l) => l.id === existing.id);
      this.state.leads[index] = updatedLead;
      this.persistState(this.state);

      return { lead: this.hydrateLead(updatedLead), isNew: false };
    }

    // Create new lead
    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      business_name: input.business_name,
      domain: domain || '',
      website: url || input.website || '',
      category: input.category || null,
      city: input.city || null,
      state: input.state || null,
      country: input.country || 'United States',
      phone: normPhone || null,
      email: normEmail || null,
      contact_name: input.contact_name || null,
      contact_role: input.contact_role || null,
      notes: input.notes || null,
      lead_score: input.lead_score || 0,
      lead_category: input.lead_category || 'UNSCORED',
      primary_service: input.primary_service || null,
      status: input.status || 'New',
      analysis_status: input.analysis_status || 'pending',
      created_at: now,
      updated_at: now,
    };

    this.state.leads.unshift(newLead);
    this.persistState(this.state);

    return { lead: this.hydrateLead(newLead), isNew: true };
  }

  public async updateLeadStatus(id: string, status: LeadStatus, note?: string): Promise<Lead | null> {
    const leadIndex = this.state.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) return null;

    const lead = this.state.leads[leadIndex];
    const prevStatus = lead.status;
    const now = new Date().toISOString();

    lead.status = status;
    lead.updated_at = now;

    // Record status history audit
    const historyItem: LeadStatusHistory = {
      id: `sh-${Date.now()}`,
      lead_id: id,
      from_status: prevStatus,
      to_status: status,
      note: note || `Status changed to ${status}`,
      created_at: now,
    };

    this.state.statusHistory.push(historyItem);
    this.persistState(this.state);

    return this.hydrateLead(lead);
  }

  public async deleteLead(id: string): Promise<boolean> {
    const leadIndex = this.state.leads.findIndex((l) => l.id === id);
    if (leadIndex === -1) return false;

    this.state.leads.splice(leadIndex, 1);
    this.state.audits = this.state.audits.filter((a) => a.lead_id !== id);
    this.state.findings = this.state.findings.filter((f) => f.lead_id !== id);
    this.state.scores = this.state.scores.filter((s) => s.lead_id !== id);
    this.state.analyses = this.state.analyses.filter((ai) => ai.lead_id !== id);
    this.state.outreach = this.state.outreach.filter((o) => o.lead_id !== id);
    this.state.statusHistory = this.state.statusHistory.filter((h) => h.lead_id !== id);

    this.persistState(this.state);
    return true;
  }

  // ==========================================
  // AUDIT & ANALYSIS PERSISTENCE
  // ==========================================

  public async saveAuditResults(data: {
    lead_id: string;
    audit: WebsiteAudit;
    findings: SeoFinding[];
    score: LeadScore;
    ai_analysis?: AiAnalysis | null;
    outreach_messages?: OutreachMessage[];
    primary_service?: string;
  }): Promise<Lead> {
    const { lead_id, audit, findings, score, ai_analysis, outreach_messages, primary_service } = data;
    const now = new Date().toISOString();

    // 1. Save or replace audit
    this.state.audits = this.state.audits.filter((a) => a.lead_id !== lead_id);
    this.state.audits.push(audit);

    // 2. Save findings
    this.state.findings = this.state.findings.filter((f) => f.lead_id !== lead_id);
    this.state.findings.push(...findings);

    // 3. Save score
    this.state.scores = this.state.scores.filter((s) => s.lead_id !== lead_id);
    this.state.scores.push(score);

    // 4. Save AI Analysis
    if (ai_analysis) {
      this.state.analyses = this.state.analyses.filter((ai) => ai.lead_id !== lead_id);
      this.state.analyses.push(ai_analysis);
    }

    // 5. Save Outreach Messages
    if (outreach_messages && outreach_messages.length > 0) {
      this.state.outreach = this.state.outreach.filter((o) => o.lead_id !== lead_id);
      this.state.outreach.push(...outreach_messages);
    }

    // 6. Update Lead Score & Status
    const leadIndex = this.state.leads.findIndex((l) => l.id === lead_id);
    if (leadIndex !== -1) {
      const lead = this.state.leads[leadIndex];
      let cat: LeadCategory = 'LOW';
      if (score.total_score >= 80) cat = 'HOT';
      else if (score.total_score >= 60) cat = 'WARM';
      else if (score.total_score >= 40) cat = 'POTENTIAL';

      lead.lead_score = score.total_score;
      lead.lead_category = cat;
      lead.primary_service = primary_service || ai_analysis?.primary_service || lead.primary_service || 'Website + SEO';
      lead.analysis_status = 'completed';
      lead.updated_at = now;
      this.state.leads[leadIndex] = lead;
    }

    this.persistState(this.state);
    return (await this.getLeadById(lead_id))!;
  }

  public async saveOutreachMessage(leadId: string, message: OutreachMessage): Promise<void> {
    // Remove existing of same variation
    this.state.outreach = this.state.outreach.filter(
      (o) => !(o.lead_id === leadId && o.variation_type === message.variation_type)
    );
    this.state.outreach.push(message);
    this.persistState(this.state);
  }

  // ==========================================
  // DASHBOARD AGGREGATE STATS
  // ==========================================

  public async getDashboardStats(): Promise<DashboardStats> {
    const leads = this.state.leads;
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.lead_score >= 60).length;
    const hotLeads = leads.filter((l) => l.lead_score >= 80).length;
    const warmLeads = leads.filter((l) => l.lead_score >= 60 && l.lead_score < 80).length;
    const leadsAnalyzed = leads.filter((l) => l.analysis_status === 'completed').length;

    const totalScores = leads.reduce((acc, l) => acc + (l.lead_score || 0), 0);
    const averageScore = totalLeads > 0 ? Math.round(totalScores / totalLeads) : 0;

    const websiteOpportunities = leads.filter((l) =>
      l.primary_service?.toLowerCase().includes('website')
    ).length;

    const seoOpportunities = leads.filter(
      (l) =>
        l.primary_service?.toLowerCase().includes('seo') &&
        !l.primary_service?.toLowerCase().includes('local')
    ).length;

    const localSeoOpportunities = leads.filter((l) =>
      l.primary_service?.toLowerCase().includes('local') ||
      l.primary_service?.toLowerCase().includes('gbp')
    ).length;

    const conversionPipeline: Record<LeadStatus, number> = {
      New: leads.filter((l) => l.status === 'New').length,
      Qualified: leads.filter((l) => l.status === 'Qualified').length,
      Contacted: leads.filter((l) => l.status === 'Contacted').length,
      Replied: leads.filter((l) => l.status === 'Replied').length,
      Meeting: leads.filter((l) => l.status === 'Meeting').length,
      Won: leads.filter((l) => l.status === 'Won').length,
      Lost: leads.filter((l) => l.status === 'Lost').length,
      Archived: leads.filter((l) => l.status === 'Archived').length,
    };

    return {
      totalLeads,
      qualifiedLeads,
      hotLeads,
      warmLeads,
      averageScore,
      websiteOpportunities,
      seoOpportunities,
      localSeoOpportunities,
      leadsAnalyzed,
      conversionPipeline,
    };
  }
}

export const db = new DatabaseService();
