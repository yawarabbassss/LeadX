import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GrokAiService } from '@/services/ai/grok-service';
import { OutreachMessage } from '@/types';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await db.getLeadById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const variationType = body.variationType || 'standard';
    const customPrompt = body.customPrompt;

    if (!lead.audit) {
      return NextResponse.json(
        { error: 'Lead must be analyzed first before generating outreach messages' },
        { status: 400 }
      );
    }

    const { analysis, outreachMessages } = await GrokAiService.analyzeLead({
      leadId: lead.id,
      businessName: lead.business_name,
      website: lead.website || `https://${lead.domain}`,
      category: lead.category,
      city: lead.city,
      state: lead.state,
      contactName: lead.contact_name,
      contactRole: lead.contact_role,
      audit: lead.audit,
      findings: lead.findings || [],
      score: lead.lead_score,
    });

    const targetMessage = outreachMessages.find((m) => m.variation_type === variationType) || outreachMessages[0];

    // If customPrompt was provided, create custom tone variation
    if (customPrompt) {
      const customOutreach: OutreachMessage = {
        id: `out-custom-${Date.now()}`,
        lead_id: lead.id,
        variation_type: variationType as any,
        tone: 'custom',
        subject: targetMessage.subject,
        message_body: targetMessage.message_body,
        created_at: new Date().toISOString(),
      };
      await db.saveOutreachMessage(lead.id, customOutreach);
    }

    return NextResponse.json({
      success: true,
      analysis,
      outreachMessages,
      selectedMessage: targetMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate outreach' }, { status: 500 });
  }
}
