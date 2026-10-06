'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  UserPlus,
  UploadCloud,
  Globe,
  Check,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Bot,
} from 'lucide-react';
import { CsvColumnMapping } from '@/services/discovery/types';

const POPULAR_NICHES = [
  'HVAC',
  'Plumbing',
  'Dental',
  'Roofing',
  'Legal / Personal Injury',
  'Real Estate',
  'Cosmetic Surgery',
  'Home Remodeling',
  'Electrician',
  'Auto Repair',
  'Chiropractor',
  'Veterinary',
];

const POPULAR_CITIES = [
  { city: 'Austin', state: 'TX' },
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  { city: 'Denver', state: 'CO' },
  { city: 'Miami', state: 'FL' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Charlotte', state: 'NC' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Chicago', state: 'IL' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Las Vegas', state: 'NV' },
];

export default function FindLeadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scraper' | 'url' | 'manual' | 'csv'>('scraper');

  // Auto-Scraper Form State
  const [scrapeNiche, setScrapeNiche] = useState('HVAC');
  const [scrapeCity, setScrapeCity] = useState('Austin');
  const [scrapeState, setScrapeState] = useState('TX');
  const [scrapeLimit, setScrapeLimit] = useState(6);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // URL / Paste Discovery State
  const [urlInput, setUrlInput] = useState('');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    business_name: '',
    website: '',
    category: '',
    city: '',
    state: '',
    country: 'United States',
    phone: '',
    email: '',
    contact_name: '',
    contact_role: '',
    notes: '',
  });

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<{
    headers: string[];
    sampleRows: any[];
    suggestedMapping: CsvColumnMapping;
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<CsvColumnMapping>({
    business_name: '',
  });

  // UI status
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);

      try {
        const res = await fetch('/api/discovery/csv-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent: text }),
        });
        const data = await res.json();
        if (data.headers) {
          setCsvPreview(data);
          setColumnMapping(data.suggestedMapping);
        }
      } catch (err: any) {
        setErrorMessage('Failed to parse CSV preview');
      }
    };
    reader.readAsText(file);
  };

  // Submit and Run Scraper & Pipeline
  const handleProcessLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (activeTab === 'scraper') {
        setProgressStep(`🔍 Scraping web & business listings for ${scrapeNiche} in ${scrapeCity}, ${scrapeState}...`);

        const res = await fetch('/api/discovery/auto-scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: scrapeNiche,
            city: scrapeCity,
            state: scrapeState,
            limit: scrapeLimit,
            autoAnalyze,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to scrape leads');

        setProgressStep(`✨ Found ${data.foundCount} leads with verified contact details!`);
        router.push('/leads');
        return;
      }

      let createdLeads: any[] = [];

      if (activeTab === 'url') {
        if (!urlInput.trim()) {
          throw new Error('Please enter at least one URL or business listing.');
        }

        setProgressStep('Parsing and deduplicating URLs...');
        const res = await fetch('/api/discovery/url-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: urlInput,
            defaults: { category: scrapeNiche, city: scrapeCity, state: scrapeState },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to import URLs');
        createdLeads = data.leads || [];
      } else if (activeTab === 'manual') {
        if (!manualForm.business_name.trim()) {
          throw new Error('Business name is required.');
        }

        setProgressStep('Saving business lead...');
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...manualForm,
            category: manualForm.category || scrapeNiche,
            city: manualForm.city || scrapeCity,
            state: manualForm.state || scrapeState,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save lead');
        createdLeads = [data.lead];
      } else if (activeTab === 'csv') {
        if (!csvContent) {
          throw new Error('Please upload a valid CSV file.');
        }

        setProgressStep('Importing and mapping CSV records...');
        const res = await fetch('/api/discovery/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            csvContent,
            mapping: columnMapping,
            defaults: { category: scrapeNiche, country: 'United States' },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to import CSV');
        createdLeads = data.leads || [];
      }

      if (createdLeads.length === 0) {
        throw new Error('No leads could be identified from the input.');
      }

      // Run live analysis
      setProgressStep(`Auditing & qualifying ${createdLeads.length} website(s)...`);
      const leadIds = createdLeads.map((l) => l.id);

      await fetch('/api/leads/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      router.push('/leads');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during discovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bot className="w-7 h-7 text-emerald-600" />
          <span>Find & Scrape Leads</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Scrape local businesses, extract verified contact info (phones, emails, decision makers), and generate evidence-backed pitches automatically.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Discovery Mode Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto bg-white p-2 rounded-xl shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('scraper')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'scraper'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Auto-Scraper (Find from Scratch)</span>
          <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
            Automated
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'url'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>URL Batch Paste</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'manual'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'csv'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV Import</span>
        </button>
      </div>

      <form onSubmit={handleProcessLeads} className="space-y-6">
        {/* TAB 1: AUTOMATED SEARCH & DIRECTORY SCRAPER */}
        {activeTab === 'scraper' && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target Industry / Niche</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">Select or type custom</span>
              </div>
              <input
                type="text"
                required
                value={scrapeNiche}
                onChange={(e) => setScrapeNiche(e.target.value)}
                placeholder="e.g. HVAC, Roofing, Plumber, Dental, Legal"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white mb-3 shadow-inner"
              />

              <div className="flex flex-wrap gap-1.5">
                {POPULAR_NICHES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScrapeNiche(n)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      scrapeNiche === n
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* City & State targeting */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>US Location (City & State)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Target City</label>
                  <input
                    type="text"
                    required
                    value={scrapeCity}
                    onChange={(e) => setScrapeCity(e.target.value)}
                    placeholder="e.g. Austin, Dallas, Denver"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">State Code</label>
                  <input
                    type="text"
                    required
                    value={scrapeState}
                    onChange={(e) => setScrapeState(e.target.value.toUpperCase())}
                    placeholder="TX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white uppercase shadow-inner"
                  />
                </div>
              </div>

              {/* Popular cities quick pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_CITIES.map((loc) => (
                  <button
                    key={`${loc.city}-${loc.state}`}
                    type="button"
                    onClick={() => {
                      setScrapeCity(loc.city);
                      setScrapeState(loc.state);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      scrapeCity === loc.city && scrapeState === loc.state
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {loc.city}, {loc.state}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and contact options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Leads to Scrape
                </label>
                <select
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value={4}>4 Leads (Fast Test ~5s)</option>
                  <option value={6}>6 Leads (Standard ~8s)</option>
                  <option value={10}>10 Leads (Thorough ~12s)</option>
                  <option value={15}>15 Leads (Deep Batch ~18s)</option>
                </select>
              </div>

              <div className="flex flex-col justify-center space-y-2 pt-1">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Deep Contact Enrichment (Phone, Email, Owner)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Deterministic 0-100 Qualification & AI Pitches</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: URL BATCH / PASTE */}
        {activeTab === 'url' && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Enter or Paste Website URLs (One per line)
              </label>
              <textarea
                rows={6}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={`https://austinacspecialists.com\nprecisiondentaldenver.com\nhttps://summitroofingnc.com\nVanguard Law Group | Phoenix | https://vanguardlawgroup.com`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white leading-relaxed shadow-inner"
              />
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL ENTRY */}
        {activeTab === 'manual' && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Business Name <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.business_name}
                  onChange={(e) => setManualForm({ ...manualForm, business_name: e.target.value })}
                  placeholder="e.g. Apex Heating & Air"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={manualForm.website}
                  onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                  placeholder="e.g. https://apexheatingair.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  placeholder="e.g. (512) 555-0198"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  placeholder="e.g. service@apexheatingair.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CSV IMPORT */}
        {activeTab === 'csv' && (
          <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 text-center transition-all bg-slate-50">
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-900">
                {csvFile ? csvFile.name : 'Upload your leads CSV file'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Supports business_name, website, category, city, state, phone, email, contact_name, contact_role
              </p>
              <label className="mt-4 inline-block bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-slate-300 shadow-sm">
                <span>Browse CSV File</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {csvPreview && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    CSV Column Mapping
                  </h3>
                  <span className="text-xs text-emerald-700 font-medium">
                    Auto-mapped {Object.keys(columnMapping).filter((k) => (columnMapping as any)[k]).length} columns
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {Object.keys(columnMapping).map((field) => (
                    <div key={field}>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1 capitalize">
                        {field.replace('_', ' ')}
                      </label>
                      <select
                        value={(columnMapping as any)[field] || ''}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [field]: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      >
                        <option value="">-- None --</option>
                        {csvPreview.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {activeTab === 'scraper'
                ? `Automated local web scraper active for ${scrapeNiche} in ${scrapeCity}, ${scrapeState}.`
                : 'Responsible live crawler with deterministic evidence engine.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-7 py-3 rounded-xl shadow-md transition-all text-sm active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressStep || 'Scraping & Qualifying Leads...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white" />
                <span>
                  {activeTab === 'scraper'
                    ? `Scrape & Qualify ${scrapeNiche} Leads`
                    : 'Analyze & Scrape Leads'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
