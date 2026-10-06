'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Lead, LeadStatus, OutreachMessage } from '@/types';
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

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);

  // Outreach message active tab
  const [activeOutreachType, setActiveOutreachType] = useState<'standard' | 'short' | 'direct' | 'email'>('standard');
  const [editableMessage, setEditableMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeFindingTab, setActiveFindingTab] = useState<'All' | 'Technical SEO' | 'On-Page SEO' | 'Local SEO' | 'Website Quality'>('All');

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        const currentOutreach = data.lead.outreach_messages?.find(
          (m: OutreachMessage) => m.variation_type === activeOutreachType
        );
        setEditableMessage(
          currentOutreach?.message_body || data.lead.ai_analysis?.personalized_message || ''
        );
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  // Sync active message when tab changes
  useEffect(() => {
    if (lead) {
      const currentOutreach = lead.outreach_messages?.find(
        (m: OutreachMessage) => m.variation_type === activeOutreachType
      );
      if (currentOutreach) {
        setEditableMessage(currentOutreach.message_body);
      } else if (lead.ai_analysis?.personalized_message) {
        setEditableMessage(lead.ai_analysis.personalized_message);
      }
    }
  }, [activeOutreachType, lead]);

  // Run live analysis
  const handleRunAudit = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setEditableMessage(data.lead.ai_analysis?.personalized_message || '');
      }
    } catch (err) {
      console.error('Failed to analyze lead:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Change CRM status
  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.lead) {
        setLead((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Generate / Tune Outreach Message
  const handleGenerateOutreach = async (variationType: string, customPrompt?: string) => {
    setOutreachLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variationType, customPrompt }),
      });
      const data = await res.json();
      if (data.selectedMessage) {
        setEditableMessage(data.selectedMessage.message_body);
        fetchLead();
      }
    } catch (err) {
      console.error('Failed to generate outreach variation:', err);
    } finally {
      setOutreachLoading(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editableMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RotateCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading lead profile...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Lead Not Found</h2>
        <Link href="/leads" className="text-xs text-emerald-600 hover:underline mt-2 inline-block">
          Return to All Leads
        </Link>
      </div>
    );
  }

  let badgeClass = 'badge-low';
  if (lead.lead_category === 'HOT') badgeClass = 'badge-hot';
  else if (lead.lead_category === 'WARM') badgeClass = 'badge-warm';
  else if (lead.lead_category === 'POTENTIAL') badgeClass = 'badge-potential';

  const findingsList = lead.findings || [];
  const filteredFindings =
    activeFindingTab === 'All'
      ? findingsList
      : findingsList.filter((f) => f.category === activeFindingTab);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </Link>

        {/* CRM Status Changer */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 shadow-sm"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Profile Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {lead.business_name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeClass}`}>
                {lead.lead_score}/100 — {lead.lead_category} LEAD
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-mono font-medium"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{lead.domain || lead.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {lead.category && (
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                  {lead.category}
                </span>
              )}

              <span className="text-slate-500 font-medium">
                {lead.city && lead.state ? `${lead.city}, ${lead.state}, ${lead.country}` : lead.country}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAudit}
              disabled={analyzing}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 transition-all shadow-sm"
            >
              <RotateCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{analyzing ? 'Re-auditing...' : 'Re-run Full Audit'}</span>
            </button>
          </div>
        </div>

        {/* Contact information strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <User className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">{lead.contact_name || 'Decision Maker'}</div>
              <div className="text-[11px] text-slate-500">{lead.contact_role || 'Owner / Leadership'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900 font-mono">
                {lead.phone ? formatDisplayPhone(lead.phone) : 'No phone listed'}
              </div>
              <div className="text-[11px] text-slate-500">Direct Telephone</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900 font-mono truncate max-w-[180px]">
                {lead.email || 'No email identified'}
              </div>
              <div className="text-[11px] text-slate-500">Direct Email</div>
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic 100-Point Score Breakdown */}
      {lead.score_details && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Deterministic Qualification Score Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated strictly from verified signals & technical deficiencies.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">{lead.lead_score}</span>
              <span className="text-xs text-slate-500"> / 100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {/* Website Opportunity */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Website Opp</span>
                <span className="font-bold text-emerald-700">
                  {lead.score_details.website_opportunity} / 25
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(lead.score_details.website_opportunity / 25) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {lead.score_details.breakdown_json?.website_opportunity?.reasons?.[0] || 'Modern layout'}
              </p>
            </div>

            {/* SEO Opportunity */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">SEO Opp</span>
                <span className="font-bold text-emerald-700">
                  {lead.score_details.seo_opportunity} / 25
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(lead.score_details.seo_opportunity / 25) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {lead.score_details.breakdown_json?.seo_opportunity?.reasons?.[0] || 'Core tags analyzed'}
              </p>
            </div>

            {/* Local SEO Opportunity */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Local SEO Opp</span>
                <span className="font-bold text-emerald-700">
                  {lead.score_details.local_seo_opportunity} / 20
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(lead.score_details.local_seo_opportunity / 20) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {lead.score_details.breakdown_json?.local_seo_opportunity?.reasons?.[0] || 'Local schema checks'}
              </p>
            </div>

            {/* Business Potential */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Business Potential</span>
                <span className="font-bold text-emerald-700">
                  {lead.score_details.business_potential} / 15
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(lead.score_details.business_potential / 15) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {lead.score_details.breakdown_json?.business_potential?.reasons?.[0] || 'Commercial value'}
              </p>
            </div>

            {/* Contactability */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Contactability</span>
                <span className="font-bold text-emerald-700">
                  {lead.score_details.contactability} / 15
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${(lead.score_details.contactability / 15) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {lead.score_details.breakdown_json?.contactability?.reasons?.[0] || 'Direct contact status'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Qualification & Commercial Rationale */}
      {lead.ai_analysis && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              AI Qualification & Commercial Rationale
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Why this business is a potential client
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {lead.ai_analysis.qualification_reason}
              </p>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Recommended Pitch Angle
              </span>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {lead.ai_analysis.recommended_pitch_angle}
              </p>
            </div>
          </div>

          {/* Primary & Secondary Recommended Services */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs text-slate-500">Recommended Pitch:</span>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              Primary: {lead.ai_analysis.primary_service}
            </span>
            {lead.ai_analysis.secondary_service && (
              <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                Add-on: {lead.ai_analysis.secondary_service}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Personalized Outreach Pitch Generator */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Personalized Evidence Outreach
            </h2>
          </div>

          {/* Outreach Variation Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveOutreachType('standard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeOutreachType === 'standard'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOutreachType('short');
                handleGenerateOutreach('short');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeOutreachType === 'short'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Make Shorter
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOutreachType('direct');
                handleGenerateOutreach('direct');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeOutreachType === 'direct'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Make More Direct
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOutreachType('email');
                handleGenerateOutreach('email');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeOutreachType === 'email'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email Version
            </button>
          </div>
        </div>

        {/* Message Editor Box */}
        <div className="relative">
          <textarea
            rows={7}
            value={editableMessage}
            onChange={(e) => setEditableMessage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-sans text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white leading-relaxed shadow-inner"
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{editableMessage.split(/\s+/).filter(Boolean).length} words</span>
              <span>•</span>
              <span>Low-pressure conversational angle</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateOutreach(activeOutreachType)}
                disabled={outreachLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${outreachLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence-First Findings & Diagnostics */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Website Evidence & SEO Diagnostics ({findingsList.length} Checks)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Factual proof extracted directly from page source and headers.
            </p>
          </div>

          {/* Diagnostic Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['All', 'Technical SEO', 'On-Page SEO', 'Local SEO', 'Website Quality'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFindingTab(tab as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFindingTab === tab
                    ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
            let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

            if (finding.status === 'fail') {
              statusIcon = <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
              statusBadge = 'bg-red-50 text-red-700 border-red-200';
            } else if (finding.status === 'warning') {
              statusIcon = <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
              statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
            }

            return (
              <div
                key={finding.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {statusIcon}
                    <span className="font-bold text-sm text-slate-900">{finding.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                    {finding.category} • {finding.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{finding.description}</p>

                {/* Exact Evidence Box */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-inner">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Detected Evidence:
                  </div>
                  <div className="font-mono text-slate-800 text-[11px] break-all">
                    {finding.evidence}
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1">
                  <strong className="text-slate-800">Actionable Fix: </strong>
                  {finding.recommendation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
