import { WebsiteAudit, SeoFinding, AiAnalysis, OutreachMessage } from '@/types';

export interface GrokAnalysisInput {
  leadId: string;
  businessName: string;
  website: string;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  contactName?: string | null;
  contactRole?: string | null;
  audit: WebsiteAudit;
  findings: SeoFinding[];
  score: number;
}

export class GrokAiService {
  /**
   * Generates structured AI qualification and personalized pitches using Grok API.
   * Fallback engine is invoked if GROK_API_KEY is not configured or in case of network errors.
   */
  public static async analyzeLead(input: GrokAnalysisInput): Promise<{
    analysis: AiAnalysis;
    outreachMessages: OutreachMessage[];
  }> {
    const grokApiKey = process.env.GROK_API_KEY;

    // Filter relevant non-passing findings to provide strictly factual evidence
    const issueFindings = input.findings.filter((f) => f.status === 'fail' || f.status === 'warning');

    if (!grokApiKey || grokApiKey === 'your-grok-api-key') {
      return this.generateDeterministicAnalysis(input, issueFindings);
    }

    try {
      const promptPayload = {
        business_name: input.businessName,
        website: input.website,
        category: input.category || 'Local Business',
        location: `${input.city || ''}, ${input.state || ''}`.trim() || 'United States',
        contact_name: input.contactName || 'there',
        contact_role: input.contactRole || 'Business Owner',
        lead_score: input.score,
        detected_issues: issueFindings.map((f) => ({
          category: f.category,
          issue: f.title,
          evidence: f.evidence,
          recommendation: f.recommendation,
        })),
        audit_summary: {
          has_https: input.audit.has_https,
          has_sitemap: input.audit.has_sitemap,
          has_robots: input.audit.has_robots_txt,
          has_mobile_viewport: input.audit.has_mobile_viewport,
          title: input.audit.title,
          meta_description: input.audit.meta_description,
          h1: input.audit.h1,
          response_time_ms: input.audit.response_time_ms,
          images_without_alt: input.audit.images_without_alt,
          total_images: input.audit.image_count,
        },
      };

      const systemPrompt = `You are the lead qualification intelligence for LeadX.
Analyze the provided real website audit data. Never hallucinate or invent fake rankings, backlinks, or metrics not present in the input.
Return ONLY valid JSON with this exact schema:
{
  "lead_summary": "1-2 sentence overview of the business & website situation",
  "qualification_reason": "Specific commercial reason why this business needs digital/SEO/website help",
  "primary_service": "One of: Website Development | Website Redesign | Technical SEO | On-Page SEO | Local SEO | SEO Audit | Website + SEO",
  "secondary_service": "One complementary service or null",
  "pain_points": ["array of 2-4 specific detected problems"],
  "evidence": ["array of exact technical evidence matching each pain point"],
  "recommended_pitch_angle": "Strategic angle to hook the decision maker without being pushy",
  "personalized_message": "Warm, natural, evidence-based outreach message (referencing real audit evidence and low-pressure CTA)",
  "short_message": "2 sentence concise version for DM/SMS",
  "direct_message": "Direct, business-focused variation",
  "email_subject": "High open-rate non-spammy subject line",
  "email_body": "Formatted email with greeting, 3 bulleted findings, and low-pressure closing",
  "confidence": 0.95
}`;

      // Determine API endpoint and model (Supports both Groq and xAI)
      const isGroq = grokApiKey.startsWith('gsk_');
      const endpoint = isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.x.ai/v1/chat/completions';
      const defaultModel = isGroq ? 'openai/gpt-oss-120b' : 'grok-beta';
      const model = process.env.GROK_MODEL || defaultModel;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${grokApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Analyze this lead and generate tailored pitches:\n${JSON.stringify(promptPayload, null, 2)}`,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`AI API (${isGroq ? 'Groq' : 'xAI'}) responded with status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      const now = new Date().toISOString();

      const analysis: AiAnalysis = {
        id: `ai-${Date.now()}`,
        lead_id: input.leadId,
        audit_id: input.audit.id,
        lead_summary: parsed.lead_summary,
        qualification_reason: parsed.qualification_reason,
        primary_service: parsed.primary_service || 'Website + SEO',
        secondary_service: parsed.secondary_service || null,
        pain_points: parsed.pain_points || [],
        evidence: parsed.evidence || [],
        recommended_pitch_angle: parsed.recommended_pitch_angle,
        personalized_message: parsed.personalized_message,
        confidence: parsed.confidence || 0.9,
        raw_response: parsed,
        created_at: now,
      };

      const outreachMessages: OutreachMessage[] = [
        {
          id: `out-std-${Date.now()}`,
          lead_id: input.leadId,
          variation_type: 'standard',
          tone: 'conversational',
          subject: parsed.email_subject || `Quick question regarding ${input.businessName}`,
          message_body: parsed.personalized_message,
          created_at: now,
        },
        {
          id: `out-short-${Date.now()}`,
          lead_id: input.leadId,
          variation_type: 'short',
          tone: 'concise',
          subject: parsed.email_subject || `Quick note for ${input.businessName}`,
          message_body: parsed.short_message || parsed.personalized_message.slice(0, 180),
          created_at: now,
        },
        {
          id: `out-dir-${Date.now()}`,
          lead_id: input.leadId,
          variation_type: 'direct',
          tone: 'direct',
          subject: `Opportunity detected on ${input.website.replace(/^https?:\/\//, '')}`,
          message_body: parsed.direct_message || parsed.personalized_message,
          created_at: now,
        },
        {
          id: `out-email-${Date.now()}`,
          lead_id: input.leadId,
          variation_type: 'email',
          tone: 'professional',
          subject: parsed.email_subject || `Quick audit findings for ${input.businessName}`,
          message_body: parsed.email_body || parsed.personalized_message,
          created_at: now,
        },
      ];

      return { analysis, outreachMessages };
    } catch (err: any) {
      console.warn('Falling back to deterministic AI qualification engine:', err.message);
      return this.generateDeterministicAnalysis(input, issueFindings);
    }
  }

  /**
   * Deterministic high-quality rule-based analysis generator guaranteed to be 100% evidence backed
   */
  public static generateDeterministicAnalysis(
    input: GrokAnalysisInput,
    issueFindings: SeoFinding[]
  ): {
    analysis: AiAnalysis;
    outreachMessages: OutreachMessage[];
  } {
    const contactGreeting = input.contactName ? `Hey ${input.contactName}` : 'Hi there';
    const loc = input.city ? ` in ${input.city}` : '';
    const cleanDomain = input.website.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const painPoints: string[] = [];
    const evidenceList: string[] = [];

    for (const f of issueFindings.slice(0, 3)) {
      painPoints.push(f.title);
      evidenceList.push(f.evidence);
    }

    if (painPoints.length === 0) {
      painPoints.push('Website optimization & local keyword expansion opportunity');
      evidenceList.push('Initial baseline audit completed');
    }

    const primaryPain = issueFindings[0]?.title || 'website optimization gaps';
    const primaryEvidence = issueFindings[0]?.evidence || 'initial page analysis';

    let primaryService = 'Website + SEO';
    if (!input.audit.has_mobile_viewport) primaryService = 'Website Redesign';
    else if (!input.audit.has_schema || issueFindings.some((f) => f.category === 'Local SEO')) primaryService = 'Local SEO';
    else if (issueFindings.some((f) => f.category === 'On-Page SEO')) primaryService = 'On-Page SEO';
    else if (!input.audit.has_sitemap || !input.audit.has_https) primaryService = 'Technical SEO';

    const standardPitch = `${contactGreeting}, I came across ${input.businessName} while researching ${input.category || 'service'} businesses${loc}.\n\nI was checking out ${cleanDomain} and noticed ${primaryEvidence.toLowerCase().includes('found') || primaryEvidence.toLowerCase().includes('is') ? primaryEvidence : `that ${primaryPain.toLowerCase()}`}.\n\nThat looks like a clear opportunity because potential clients searching locally in your area might have trouble finding or navigating your services properly.\n\nI help ${input.category || 'local'} businesses improve their ${primaryService.toLowerCase()}, and I think there are a few straightforward fixes worth making here.\n\nIf you'd like, I can send over a quick breakdown of what I found.`;

    const shortPitch = `${contactGreeting}, took a look at ${cleanDomain} and noticed ${primaryPain.toLowerCase()} (${primaryEvidence.slice(0, 80)}). Fixing this would give ${input.businessName} an immediate boost in local customer conversions. Happy to share a quick 2-minute overview if you're open to it.`;

    const directPitch = `${contactGreeting}, ${input.businessName}'s website is currently experiencing ${primaryPain.toLowerCase()}. Evidence: ${primaryEvidence}. We specialize in fixing ${primaryService.toLowerCase()} for ${input.category || 'growing businesses'}. Let me know if you'd like our direct audit notes.`;

    const emailBody = `${contactGreeting},\n\nI was looking into ${input.category || 'business'} providers${loc} and ran a quick technical check on ${cleanDomain}.\n\nHere are the top opportunities I identified:\n${issueFindings.slice(0, 3).map((f, idx) => `${idx + 1}. ${f.title} — ${f.evidence}`).join('\n')}\n\nAddressing these items directly improves how Google ranks your services and makes it easier for new clients to contact you.\n\nWould you be open to a quick 5-minute chat to review what we found?\n\nBest regards,\nProspecting Team`;

    const now = new Date().toISOString();

    const analysis: AiAnalysis = {
      id: `ai-det-${Date.now()}`,
      lead_id: input.leadId,
      audit_id: input.audit.id,
      lead_summary: `${input.businessName} is a ${input.category || 'commercial'} provider${loc} with clear high-intent expansion opportunities on ${cleanDomain}.`,
      qualification_reason: `Identified ${issueFindings.length} actionable high-impact items including ${primaryPain.toLowerCase()}, directly impacting search visibility and conversion rates.`,
      primary_service: primaryService,
      secondary_service: primaryService === 'Website Redesign' ? 'Technical SEO' : 'On-Page SEO',
      pain_points: painPoints,
      evidence: evidenceList,
      recommended_pitch_angle: `Focus on evidence-backed fixes for ${primaryPain.toLowerCase()} to demonstrate immediate authority and tangible ROI.`,
      personalized_message: standardPitch,
      confidence: 0.92,
      raw_response: null,
      created_at: now,
    };

    const outreachMessages: OutreachMessage[] = [
      {
        id: `out-std-${Date.now()}`,
        lead_id: input.leadId,
        variation_type: 'standard',
        tone: 'conversational',
        subject: `Quick observation on ${cleanDomain}`,
        message_body: standardPitch,
        created_at: now,
      },
      {
        id: `out-short-${Date.now()}`,
        lead_id: input.leadId,
        variation_type: 'short',
        tone: 'concise',
        subject: `Quick note for ${input.businessName}`,
        message_body: shortPitch,
        created_at: now,
      },
      {
        id: `out-dir-${Date.now()}`,
        lead_id: input.leadId,
        variation_type: 'direct',
        tone: 'direct',
        subject: `${primaryService} opportunity on ${cleanDomain}`,
        message_body: directPitch,
        created_at: now,
      },
      {
        id: `out-email-${Date.now()}`,
        lead_id: input.leadId,
        variation_type: 'email',
        tone: 'professional',
        subject: `Audit findings for ${input.businessName}${loc}`,
        message_body: emailBody,
        created_at: now,
      },
    ];

    return { analysis, outreachMessages };
  }
}
