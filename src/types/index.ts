export type LeadCategory = 'HOT' | 'WARM' | 'POTENTIAL' | 'LOW' | 'UNSCORED';

export type LeadStatus =
  | 'New'
  | 'Qualified'
  | 'Contacted'
  | 'Replied'
  | 'Meeting'
  | 'Won'
  | 'Lost'
  | 'Archived';

export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'partial' | 'failed';

export type ServiceType =
  | 'Website Development'
  | 'Website Redesign'
  | 'Technical SEO'
  | 'On-Page SEO'
  | 'Off-Page SEO'
  | 'Local SEO'
  | 'GBP Optimization'
  | 'SEO Audit'
  | 'Website + SEO'
  | 'Multiple Opportunities';

export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  is_primary: boolean;
  notes?: string | null;
  created_at: string;
}

export interface WebsiteAudit {
  id: string;
  lead_id: string;
  url: string;
  final_url?: string | null;
  http_status?: number | null;
  response_time_ms?: number | null;
  has_https: boolean;
  has_robots_txt: boolean;
  has_sitemap: boolean;
  has_mobile_viewport: boolean;
  has_schema: boolean;
  is_indexable: boolean;
  canonical_url?: string | null;
  title?: string | null;
  meta_description?: string | null;
  h1?: string | null;
  heading_count: number;
  image_count: number;
  images_without_alt: number;
  broken_links_sample: string[];
  internal_links_count: number;
  external_links_count: number;
  detected_technologies: string[];
  raw_signals: Record<string, any>;
  created_at: string;
}

export interface SeoFinding {
  id: string;
  audit_id: string;
  lead_id: string;
  category: 'Technical SEO' | 'On-Page SEO' | 'Local SEO' | 'Website Quality';
  check_name: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  score_impact: number;
  title: string;
  description: string;
  evidence: string;
  recommendation: string;
  created_at: string;
}

export interface ScoreBreakdownItem {
  category: string;
  max_score: number;
  awarded_score: number;
  reasons: string[];
}

export interface LeadScore {
  id: string;
  lead_id: string;
  total_score: number; // 0 - 100
  website_opportunity: number; // 0 - 25
  seo_opportunity: number; // 0 - 25
  local_seo_opportunity: number; // 0 - 20
  business_potential: number; // 0 - 15
  contactability: number; // 0 - 15
  breakdown_json: {
    website_opportunity: ScoreBreakdownItem;
    seo_opportunity: ScoreBreakdownItem;
    local_seo_opportunity: ScoreBreakdownItem;
    business_potential: ScoreBreakdownItem;
    contactability: ScoreBreakdownItem;
  };
  created_at: string;
}

export interface AiAnalysis {
  id: string;
  lead_id: string;
  audit_id?: string | null;
  lead_summary: string;
  qualification_reason: string;
  primary_service: string;
  secondary_service?: string | null;
  pain_points: string[];
  evidence: string[];
  recommended_pitch_angle: string;
  personalized_message: string;
  confidence: number;
  raw_response?: Record<string, any> | null;
  created_at: string;
}

export interface OutreachMessage {
  id: string;
  lead_id: string;
  variation_type: 'standard' | 'short' | 'direct' | 'email';
  tone: string;
  subject?: string | null;
  message_body: string;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  note?: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  user_id?: string;
  campaign_id?: string | null;
  business_name: string;
  domain: string;
  website: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  phone?: string | null;
  email?: string | null;
  contact_name?: string | null;
  contact_role?: string | null;
  notes?: string | null;
  lead_score: number;
  lead_category: LeadCategory;
  primary_service?: ServiceType | string | null;
  status: LeadStatus;
  analysis_status: AnalysisStatus;
  error_message?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations
  contacts?: LeadContact[];
  audit?: WebsiteAudit | null;
  findings?: SeoFinding[];
  score_details?: LeadScore | null;
  ai_analysis?: AiAnalysis | null;
  outreach_messages?: OutreachMessage[];
  status_history?: LeadStatusHistory[];
}

export interface LeadFilters {
  query?: string;
  minScore?: number;
  maxScore?: number;
  category?: LeadCategory | 'ALL';
  industry?: string;
  location?: string;
  primaryService?: string;
  status?: LeadStatus | 'ALL';
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasWebsite?: boolean;
  analysisStatus?: AnalysisStatus | 'ALL';
  sortBy?: 'score_desc' | 'score_asc' | 'created_desc' | 'updated_desc' | 'name_asc';
}

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  warmLeads: number;
  averageScore: number;
  websiteOpportunities: number;
  seoOpportunities: number;
  localSeoOpportunities: number;
  leadsAnalyzed: number;
  conversionPipeline: Record<LeadStatus, number>;
}
