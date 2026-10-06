import { NextRequest, NextResponse } from 'next/server';
import { CsvDiscoveryProvider } from '@/services/discovery/csv-provider';
import { CsvColumnMapping } from '@/services/discovery/types';

export async function POST(request: NextRequest) {
  try {
    const { csvContent, mapping, defaults } = await request.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Valid CSV content is required' }, { status: 400 });
    }

    if (!mapping || !mapping.business_name) {
      return NextResponse.json({ error: 'Valid column mapping with business_name is required' }, { status: 400 });
    }

    const result = await CsvDiscoveryProvider.importCsv(
      csvContent,
      mapping as CsvColumnMapping,
      defaults || {}
    );

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      duplicateCount: result.duplicateCount,
      leads: result.leads,
      errors: result.errors,
      message: `Successfully processed ${result.leads.length} leads (${result.importedCount} new, ${result.duplicateCount} updated duplicates)`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to import CSV leads' }, { status: 500 });
  }
}
