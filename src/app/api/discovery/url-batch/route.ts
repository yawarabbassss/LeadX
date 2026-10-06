import { NextRequest, NextResponse } from 'next/server';
import { UrlDiscoveryProvider } from '@/services/discovery/url-provider';

export async function POST(request: NextRequest) {
  try {
    const { rawText, defaults } = await request.json();

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Please provide at least one website URL or list' }, { status: 400 });
    }

    const result = await UrlDiscoveryProvider.discoverFromInput(rawText, defaults || {});

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      duplicateCount: result.duplicateCount,
      leads: result.leads,
      errors: result.errors,
      message: `Processed ${result.leads.length} URLs (${result.importedCount} new, ${result.duplicateCount} updated duplicates)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process URLs' }, { status: 500 });
  }
}
