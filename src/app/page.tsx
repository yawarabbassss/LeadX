import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import {
  Users,
  Flame,
  CheckCircle2,
  TrendingUp,
  Globe,
  Search,
  MapPin,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { formatDisplayPhone } from '@/services/normalizer/phone';

export const revalidate = 0; // Dynamic server rendering

export default async function DashboardPage() {
  const stats = await db.getDashboardStats();
  const { leads: recentLeads } = await db.getLeads({ sortBy: 'created_desc' });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Prospecting Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Identify high-probability prospects with verified technical & SEO deficiencies.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/find"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover & Scrape Leads</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metric Cards (8 key metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalLeads}</span>
            <span className="text-xs text-slate-500">businesses</span>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-white border border-red-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">🔥 Hot Leads (80–100)</span>
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.hotLeads}</span>
            <span className="text-xs text-red-600 font-medium">Ready to pitch</span>
          </div>
        </div>

        {/* Qualified Leads */}
        <div className="bg-white border border-emerald-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Qualified Leads (60+)</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.qualifiedLeads}</span>
            <span className="text-xs text-slate-500">
              {stats.totalLeads > 0 ? `${Math.round((stats.qualifiedLeads / stats.totalLeads) * 100)}% of total` : '0%'}
            </span>
          </div>
        </div>

        {/* Average Lead Score */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.averageScore}</span>
            <span className="text-xs text-slate-500">/ 100 max</span>
          </div>
        </div>
      </div>

      {/* Secondary Service Opportunities & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/leads?service=Website"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-xl transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Website Opportunities</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.websiteOpportunities}</p>
          <p className="text-xs text-slate-500 mt-1">Mobile, CTA, and conversion redesign opportunities</p>
        </Link>

        <Link
          href="/leads?service=SEO"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-xl transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900">SEO Opportunities</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.seoOpportunities}</p>
          <p className="text-xs text-slate-500 mt-1">Technical, on-page, and meta tag optimization</p>
        </Link>

        <Link
          href="/leads?service=Local"
          className="bg-white hover:bg-slate-50 border border-slate-200 p-5 rounded-xl transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900">Local SEO Opportunities</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.localSeoOpportunities}</p>
          <p className="text-xs text-slate-500 mt-1">Local schema, NAP & service area landing pages</p>
        </Link>
      </div>

      {/* Recent Qualified Prospects Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Qualified Leads</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prospects with completed evidence audits and pitch angles.
            </p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All Leads ({stats.totalLeads})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Business</th>
                <th className="px-4 py-3.5">Location</th>
                <th className="px-4 py-3.5">Recommended Service</th>
                <th className="px-4 py-3.5">Score & Category</th>
                <th className="px-4 py-3.5">CRM Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.slice(0, 6).map((lead) => {
                let badgeClass = 'badge-low';
                if (lead.lead_category === 'HOT') badgeClass = 'badge-hot';
                else if (lead.lead_category === 'WARM') badgeClass = 'badge-warm';
                else if (lead.lead_category === 'POTENTIAL') badgeClass = 'badge-potential';

                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{lead.business_name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
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
                          <span>{lead.domain || 'No website'}</span>
                        )}
                        {lead.category && (
                          <>
                            <span>•</span>
                            <span>{lead.category}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-medium">
                        {lead.city && lead.state ? `${lead.city}, ${lead.state}` : lead.country || 'USA'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200">
                        {lead.primary_service || 'Website + SEO'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeClass}`}>
                          {lead.lead_category}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{lead.lead_score}</span>
                        <span className="text-[10px] text-slate-400">/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-xs font-semibold border border-emerald-200 transition-all"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
