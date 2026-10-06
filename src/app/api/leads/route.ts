import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LeadFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LeadFilters = {
      query: searchParams.get('q') || undefined,
      category: (searchParams.get('category') as any) || undefined,
      industry: searchParams.get('industry') || undefined,
      primaryService: searchParams.get('service') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      hasEmail: searchParams.get('hasEmail') === 'true' ? true : undefined,
      hasPhone: searchParams.get('hasPhone') === 'true' ? true : undefined,
      hasWebsite: searchParams.get('hasWebsite') === 'true' ? true : undefined,
      analysisStatus: (searchParams.get('analysisStatus') as any) || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'created_desc',
    };

    const minScore = searchParams.get('minScore');
    if (minScore !== null && minScore !== '') {
      filters.minScore = parseInt(minScore, 10);
    }

    const maxScore = searchParams.get('maxScore');
    if (maxScore !== null && maxScore !== '') {
      filters.maxScore = parseInt(maxScore, 10);
    }

    const { leads, total } = await db.getLeads(filters);
    return NextResponse.json({ leads, total });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.business_name || typeof body.business_name !== 'string') {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const { lead, isNew } = await db.upsertLead(body);
    return NextResponse.json({ lead, isNew, message: isNew ? 'Lead created successfully' : 'Existing lead updated' }, { status: isNew ? 201 : 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process lead' }, { status: 500 });
  }
}
