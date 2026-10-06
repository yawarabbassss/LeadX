import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WebsiteCrawler } from '@/services/crawler/crawler';
import { WebsiteAuditEngine } from '@/services/analyzer';
import { LeadScoringEngine } from '@/services/scorer/scoring-engine';
import { GrokAiService } from '@/services/ai/grok-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await db.getLeadById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.website && !lead.domain) {
      return NextResponse.json(
        { error: 'Lead does not have a website URL or domain to analyze' },
        { status: 400 }
      );
    }

    const targetUrl = lead.website || `https://${lead.domain}`;

    // 1. Crawl website responsibly
    const crawl = await WebsiteCrawler.crawl(targetUrl);

    // 2. Run Comprehensive Audit Engine
    const { audit, findings } = WebsiteAuditEngine.runAudit(crawl, lead.id, {
      businessName: lead.business_name,
      category: lead.category,
      city: lead.city,
      state: lead.state,
    });

    // 3. Compute Deterministic 100-Point Score
    const { score, category: leadCategory, primaryService } = LeadScoringEngine.calculate({
      leadId: lead.id,
      businessName: lead.business_name,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      phone: lead.phone,
      email: lead.email,
      contactName: lead.contact_name,
      audit,
      findings,
    });

    // 4. Run Grok AI Layer for personalized qualification and outreach pitches
    const { analysis, outreachMessages } = await GrokAiService.analyzeLead({
      leadId: lead.id,
      businessName: lead.business_name,
      website: targetUrl,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      contactName: lead.contact_name,
      contactRole: lead.contact_role,
      audit,
      findings,
      score: score.total_score,
    });

    // 5. Save all results into Database
    const updatedLead = await db.saveAuditResults({
      lead_id: lead.id,
      audit,
      findings,
      score,
      ai_analysis: analysis,
      outreach_messages: outreachMessages,
      primary_service: primaryService,
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Website analysis, scoring, and outreach generation completed successfully',
    });
  } catch (error: any) {
    console.error('Audit execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze website' },
      { status: 500 }
    );
  }
}
