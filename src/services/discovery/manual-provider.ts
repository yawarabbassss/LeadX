import { db } from '@/lib/db';
import { LeadInputData, DiscoveryResult } from './types';

export class ManualLeadProvider {
  public static async createLead(data: LeadInputData): Promise<{ lead: any; isNew: boolean }> {
    return await db.upsertLead({
      ...data,
      country: data.country || 'United States',
    });
  }
}
