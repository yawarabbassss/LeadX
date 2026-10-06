import { NextRequest, NextResponse } from 'next/server';
import { CsvDiscoveryProvider } from '@/services/discovery/csv-provider';

export async function POST(request: NextRequest) {
  try {
    const { csvContent } = await request.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Valid CSV content is required' }, { status: 400 });
    }

    const preview = CsvDiscoveryProvider.parsePreview(csvContent);
    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to parse CSV preview' }, { status: 500 });
  }
}
