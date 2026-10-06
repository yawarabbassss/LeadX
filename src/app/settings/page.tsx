'use client';

import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Database,
  Zap,
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [grokKey, setGrokKey] = useState('');
  const [grokModel, setGrokModel] = useState('openai/gpt-oss-120b');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/leads?sortBy=score_desc');
      const data = await res.json();
      const leads = data.leads || [];

      const headers = ['Business Name', 'Website', 'Category', 'City', 'State', 'Lead Score', 'Category', 'Recommended Service', 'Status', 'Phone', 'Email', 'Key Pain Point'];
      const rows = leads.map((l: any) => [
        `"${l.business_name}"`,
        `"${l.website || l.domain}"`,
        `"${l.category || ''}"`,
        `"${l.city || ''}"`,
        `"${l.state || ''}"`,
        l.lead_score,
        `"${l.lead_category}"`,
        `"${l.primary_service || ''}"`,
        `"${l.status}"`,
        `"${l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${(l.ai_analysis?.pain_points?.[0] || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `leadx_qualified_leads_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure API integrations, Supabase connection credentials, and export lead databases.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Grok / AI API Configuration */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            AI Engine Configuration (Groq & xAI Grok Support)
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          LeadX connects server-side directly to the official Groq and xAI APIs for structured lead qualification analysis and personalized messaging. API keys are strictly kept server-side and never exposed in client bundles.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GROK_API_KEY / GROQ_API_KEY
            </label>
            <input
              type="password"
              placeholder="gsk_********************************"
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
            />
            <p className="text-[10px] text-slate-400 mt-1">Configured in .env.local on server</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Model Identifier
            </label>
            <select
              value={grokModel}
              onChange={(e) => setGrokModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Ultra Fast & Structured)</option>
              <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (High Accuracy)</option>
              <option value="grok-beta">grok-beta (xAI API)</option>
              <option value="grok-2">grok-2 (xAI API)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Supabase Database & Auth */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Supabase / PostgreSQL Integration
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Supabase powers authentication, Postgres storage, and Row Level Security (RLS). When environment variables are configured, data syncs seamlessly to your Postgres instance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NEXT_PUBLIC_SUPABASE_URL
            </label>
            <input
              type="text"
              placeholder="https://your-id.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Export Prospect Data */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Download className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Export Qualified Leads
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            Download full database of qualified leads, verified pain points, phone numbers, and pitch angles formatted for CSV.
          </p>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
