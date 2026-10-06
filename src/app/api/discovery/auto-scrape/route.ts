import { NextRequest, NextResponse } from 'next/server';
import { SearchScraper } from '@/services/scraper/search-scraper';
import { db } from '@/lib/db';
import { WebsiteCrawler } from '@/services/crawler/crawler';
import { WebsiteAuditEngine } from '@/services/analyzer';
import { LeadScoringEngine } from '@/services/scorer/scoring-engine';
import { GrokAiService } from '@/services/ai/grok-service';

export async function POST(request: NextRequest) {
  try {
    const { niche, city, state, limit = 8, autoAnalyze = true } = await request.json();

    if (!niche || !city) {
      return NextResponse.json(
        { error: 'Both Industry/Niche (e.g. Plumber) and City (e.g. Austin) are required.' },
        { status: 400 }
      );
    }

    // 1. Scrape real businesses and enrich contact info
    const candidates = await SearchScraper.scrapeLocalBusinesses({
      niche,
      city,
      state: state || 'US',
      limit: Math.min(limit, 20),
      enrichContactInfo: true,
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: `No businesses could be found for "${niche}" in "${city}, ${state || 'US'}". Try a broader query.` },
        { status: 404 }
      );
    }

    const savedLeads = [];
    let newCount = 0;
    let dupCount = 0;

    // 2. Upsert leads into database with duplicate protection
    for (const item of candidates) {
      try {
        const { lead, isNew } = await db.upsertLead({
          business_name: item.business_name,
          website: item.website,
          category: item.category,
          city: item.city,
          state: item.state,
          country: item.country,
          phone: item.phone,
          email: item.email,
          contact_name: item.contact_name,
          contact_role: item.contact_role,
          notes: item.notes,
        });

        if (isNew) newCount++;
        else dupCount++;

        // 3. Auto-Audit & AI Pitch Generation if enabled
        if (autoAnalyze && lead.website) {
          try {
            const crawl = await WebsiteCrawler.crawl(lead.website);
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
              website: lead.website,
              category: lead.category,
              city: lead.city,
              state: lead.state,
              contactName: lead.contact_name,
              contactRole: lead.contact_role,
              audit,
              findings,
              score: score.total_score,
            });

            const fullySaved = await db.saveAuditResults({
              lead_id: lead.id,
              audit,
              findings,
              score,
              ai_analysis: analysis,
              outreach_messages: outreachMessages,
              primary_service: primaryService,
            });

            savedLeads.push(fullySaved);
          } catch (auditErr) {
            savedLeads.push(lead);
          }
        } else {
          savedLeads.push(lead);
        }
      } catch (err: any) {
        console.warn('Error processing scraped candidate:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      foundCount: candidates.length,
      importedCount: newCount,
      duplicateCount: dupCount,
      leads: savedLeads,
      message: `Successfully discovered and analyzed ${savedLeads.length} local ${niche} leads in ${city}, ${state || 'US'} with direct contact info.`,
    });
  } catch (error: any) {
    console.error('Auto scrape error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scrape and discover leads' },
      { status: 500 }
    );
  }
}
