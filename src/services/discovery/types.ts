import { Lead } from '@/types';

export interface LeadInputData {
  business_name: string;
  website?: string;
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  contact_role?: string;
  notes?: string;
}

export interface DiscoveryResult {
  leads: Lead[];
  importedCount: number;
  duplicateCount: number;
  errors: Array<{ index: number; row?: any; message: string }>;
}

export interface LeadDiscoveryProvider {
  id: string;
  name: string;
  description: string;
  discover(params: any): Promise<DiscoveryResult>;
}

export interface CsvColumnMapping {
  business_name: string;
  website?: string;
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  contact_role?: string;
  notes?: string;
}
