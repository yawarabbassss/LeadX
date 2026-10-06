import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WebsiteCrawler } from '@/services/crawler/crawler';
import { WebsiteAuditEngine } from '@/services/analyzer';
import { LeadScoringEngine } from '@/services/scorer/scoring-engine';
import { GrokAiService } from '@/services/ai/grok-service';

export async function POST(request: NextRequest) {
  try {
    const { leadIds } = await request.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    const analyzedLeads = [];
    const errors = [];

    // Analyze leads (limit batch size to 10 for responsive server performance)
    const targetIds = leadIds.slice(0, 10);

    for (const id of targetIds) {
      try {
        const lead = await db.getLeadById(id);
        if (!lead || (!lead.website && !lead.domain)) continue;

        const targetUrl = lead.website || `https://${lead.domain}`;
        const crawl = await WebsiteCrawler.crawl(targetUrl);
        const { audit, findings } = WebsiteAuditEngine.runAudit(crawl, lead.id, {
          businessName: lead.business_name,
          category: lead.category,
          city: lead.city,
          state: lead.state,
        });

        const { score, primaryService } = LeadScoringEngine.calculate({
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

        const saved = await db.saveAuditResults({
          lead_id: lead.id,
          audit,
          findings,
          score,
          ai_analysis: analysis,
          outreach_messages: outreachMessages,
          primary_service: primaryService,
        });

        analyzedLeads.push(saved);
      } catch (err: any) {
        errors.push({ id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      analyzedCount: analyzedLeads.length,
      leads: analyzedLeads,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Batch analysis failed' }, { status: 500 });
  }
}
