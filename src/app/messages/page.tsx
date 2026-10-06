'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { Lead } from '@/types';

export default function MessagesHubPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'hot' | 'qualified'>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/leads?sortBy=score_desc');
        const data = await res.json();
        const analyzed = (data.leads || []).filter((l: Lead) => l.ai_analysis || l.outreach_messages?.length);
        setLeads(analyzed);
        if (analyzed.length > 0) {
          setSelectedLead(analyzed[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads.filter((l) => {
    if (filterType === 'hot') return l.lead_score >= 80;
    if (filterType === 'qualified') return l.lead_score >= 60;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Outreach & Pitch Messages</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review evidence-backed pitches generated for qualified businesses.
        </p>
      </div>

      {/* Main 2-column interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left list */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ready Prospects ({filteredLeads.length})
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('hot')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  filterType === 'hot' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Hot Only
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <RotateCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                <span className="text-xs">Loading messages...</span>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No analyzed leads yet. Run an audit or scrape leads first.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 truncate max-w-[190px]">
                        {lead.business_name}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {lead.lead_score}/100
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{lead.city ? `${lead.city}, ${lead.state || 'US'}` : 'US Business'}</span>
                      <span className="text-emerald-700 font-medium">
                        {lead.primary_service || 'Website + SEO'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right detail view */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          {selectedLead ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {selectedLead.business_name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                    <span>{selectedLead.domain || selectedLead.website}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-sans font-bold">
                      {selectedLead.lead_score}/100 ({selectedLead.lead_category})
                    </span>
                  </div>
                </div>

                <Link
                  href={`/leads/${selectedLead.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span>Full Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Pitch Message Cards */}
              <div className="space-y-4">
                {/* Standard Pitch */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Primary Pitch (Evidence-First)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedLead.ai_analysis?.personalized_message || '',
                          `std-${selectedLead.id}`
                        )
                      }
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 shadow-sm"
                    >
                      {copiedId === `std-${selectedLead.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {selectedLead.ai_analysis?.personalized_message || 'Generating pitch...'}
                  </p>
                </div>

                {/* Short message variation if present */}
                {selectedLead.outreach_messages?.find((m) => m.variation_type === 'short') && (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Concise SMS / DM Version
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = selectedLead.outreach_messages?.find(
                            (m) => m.variation_type === 'short'
                          )?.message_body;
                          if (msg) handleCopy(msg, `short-${selectedLead.id}`);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-white text-xs text-slate-700 border border-slate-200 shadow-sm"
                      >
                        {copiedId === `short-${selectedLead.id}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {
                        selectedLead.outreach_messages.find((m) => m.variation_type === 'short')
                          ?.message_body
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs">
              Select a lead from the left to view pitch messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
