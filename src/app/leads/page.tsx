'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Mail,
  Phone,
  User,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { formatDisplayPhone } from '@/services/normalizer/phone';

const STATUS_OPTIONS: LeadStatus[] = [
  'New',
  'Qualified',
  'Contacted',
  'Replied',
  'Meeting',
  'Won',
  'Lost',
  'Archived',
];

function LeadsContent() {
  const searchParams = useSearchParams();

  // Filters from URL or state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'ALL');
  const [serviceFilter, setServiceFilter] = useState<string>(searchParams.get('service') || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [sortBy, setSortBy] = useState('score_desc');

  // Leads list
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'ALL') params.set('category', category);
      if (serviceFilter !== 'ALL') params.set('service', serviceFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (hasEmail) params.set('hasEmail', 'true');
      if (hasPhone) params.set('hasPhone', 'true');
      if (sortBy) params.set('sortBy', sortBy);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, [query, category, serviceFilter, statusFilter, hasEmail, hasPhone, sortBy]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Run live analysis on a single lead
  const handleRunAnalysis = async (leadId: string) => {
    setAnalyzingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
      }
    } catch (err) {
      console.error('Failed to analyze lead:', err);
    } finally {
      setAnalyzingId(null);
    }
  };

  // Change CRM status
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Copy personalized pitch
  const handleCopyPitch = (lead: Lead) => {
    const message =
      lead.ai_analysis?.personalized_message ||
      lead.outreach_messages?.[0]?.message_body ||
      `Hey ${lead.contact_name || 'there'}, I took a look at ${lead.website} and noticed several local SEO & technical optimization opportunities. Happy to send over our notes.`;

    navigator.clipboard.writeText(message);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Prospects</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Deterministic opportunity scores and evidence-backed pitches for US businesses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/find"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover More Leads</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by business name, city, domain, contact or industry..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
            />
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="HOT">🔥 HOT (80–100)</option>
            <option value="WARM">🟠 WARM (60–79)</option>
            <option value="POTENTIAL">🟡 POTENTIAL (40–59)</option>
            <option value="LOW">⚪ LOW (0–39)</option>
          </select>

          {/* Service Opportunity Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">All Services</option>
            <option value="Website">Website Development / Redesign</option>
            <option value="Technical SEO">Technical SEO</option>
            <option value="On-Page SEO">On-Page SEO</option>
            <option value="Local">Local SEO / GBP</option>
            <option value="SEO Audit">SEO Audit</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">All CRM Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="score_desc">Highest Score First</option>
            <option value="score_asc">Lowest Score First</option>
            <option value="created_desc">Newest Added First</option>
            <option value="updated_desc">Recently Analyzed</option>
            <option value="name_asc">Business Name (A-Z)</option>
          </select>
        </div>

        {/* Checkbox Toggles */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={hasEmail}
              onChange={(e) => setHasEmail(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-emerald-600 focus:ring-0"
            />
            <span>Has Email Address</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              checked={hasPhone}
              onChange={(e) => setHasPhone(e.target.checked)}
              className="rounded bg-slate-100 border-slate-300 text-emerald-600 focus:ring-0"
            />
            <span>Has Phone Number</span>
          </label>

          <span className="text-slate-500 font-mono ml-auto">
            Showing <strong className="text-slate-900">{leads.length}</strong> of {total} leads
          </span>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Business & Contact</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Opportunity & Key Pain Point</th>
                <th className="px-4 py-3.5">Score</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Loading verified prospects...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">No matching leads found</p>
                    <p className="text-xs text-slate-500 mt-1">Try searching for a different city or niche.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  let badgeClass = 'badge-low';
                  if (lead.lead_category === 'HOT') badgeClass = 'badge-hot';
                  else if (lead.lead_category === 'WARM') badgeClass = 'badge-warm';
                  else if (lead.lead_category === 'POTENTIAL') badgeClass = 'badge-potential';

                  const keyPainPoint =
                    lead.ai_analysis?.pain_points?.[0] ||
                    lead.findings?.find((f) => f.status === 'fail')?.title ||
                    lead.findings?.find((f) => f.status === 'warning')?.title ||
                    'Analysis pending';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      {/* Business & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 text-sm hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{lead.business_name}</span>
                          </Link>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            {lead.website ? (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:underline flex items-center gap-1 font-mono"
                              >
                                <span>{lead.domain || lead.website}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="font-mono">{lead.domain || 'No website'}</span>
                            )}
                            {lead.category && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600">{lead.category}</span>
                              </>
                            )}
                          </div>

                          {/* Contact icons */}
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600">
                            {lead.contact_name && (
                              <span className="flex items-center gap-1 text-slate-700">
                                <User className="w-3 h-3 text-slate-500" />
                                {lead.contact_name}
                              </span>
                            )}
                            {lead.phone && (
                              <span className="flex items-center gap-1 text-slate-700 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {formatDisplayPhone(lead.phone)}
                              </span>
                            )}
                            {lead.email && (
                              <span className="flex items-center gap-1 text-slate-700 font-mono">
                                <Mail className="w-3 h-3 text-emerald-600" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-4">
                        <div className="text-slate-800 font-medium">
                          {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.country || 'USA'}
                        </div>
                        {lead.city && <div className="text-[10px] text-slate-400">US Market</div>}
                      </td>

                      {/* Opportunity & Pain Point */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold mb-1">
                          {lead.primary_service || 'Website + SEO'}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {keyPainPoint}
                        </p>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeClass}`}>
                            {lead.lead_category}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{lead.lead_score}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </td>

                      {/* CRM Status dropdown */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-emerald-500 font-medium shadow-sm"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Analyze button */}
                          <button
                            type="button"
                            onClick={() => handleRunAnalysis(lead.id)}
                            disabled={analyzingId === lead.id}
                            title="Re-run live website analysis"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${analyzingId === lead.id ? 'animate-spin text-emerald-600' : ''}`} />
                          </button>

                          {/* Copy Pitch Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyPitch(lead)}
                            title="Copy personalized pitch message"
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                              copiedId === lead.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {copiedId === lead.id ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Pitch</span>
                              </>
                            )}
                          </button>

                          {/* View Profile */}
                          <Link
                            href={`/leads/${lead.id}`}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs font-semibold border border-emerald-200 transition-all"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-slate-500">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <span className="text-xs">Loading leads...</span>
        </div>
      }
    >
      <LeadsContent />
    </Suspense>
  );
}
