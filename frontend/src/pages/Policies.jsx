import React, { useState } from 'react';
import {
  Users, Search, Shield, ShieldCheck, ShieldAlert,
  CheckCircle2, Clock, AlertTriangle, Star, TrendingUp,
  MoreVertical, Eye, Phone, Mail, ArrowUpRight, Plus,
  FileText, BarChart3, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const policies = [
  {
    id: 'POL-10046',
    holder: 'Marcus Johnson',
    initials: 'MJ',
    type: 'Comprehensive Auto',
    premium: '$1,840/yr',
    startDate: 'Jan 3, 2026',
    endDate: 'Jan 3, 2027',
    status: 'Active',
    risk: 'Low',
    claims: 0,
    fraudScore: 12,
    email: 'marcus@email.com',
    phone: '+1 (555) 210-4432',
    coverageAmount: '$150,000',
  },
  {
    id: 'POL-10047',
    holder: 'Sophia Chen',
    initials: 'SC',
    type: 'Medical Premium',
    premium: '$3,200/yr',
    startDate: 'Feb 10, 2026',
    endDate: 'Feb 10, 2027',
    status: 'Active',
    risk: 'Medium',
    claims: 2,
    fraudScore: 55,
    email: 'sofia@email.com',
    phone: '+1 (555) 987-3322',
    coverageAmount: '$500,000',
  },
  {
    id: 'POL-10048',
    holder: 'David Park',
    initials: 'DP',
    type: 'Property & Casualty',
    premium: '$2,400/yr',
    startDate: 'Mar 1, 2026',
    endDate: 'Mar 1, 2027',
    status: 'Under Review',
    risk: 'High',
    claims: 4,
    fraudScore: 88,
    email: 'david.p@email.com',
    phone: '+1 (555) 765-1234',
    coverageAmount: '$200,000',
  },
  {
    id: 'POL-10049',
    holder: 'Olivia Martinez',
    initials: 'OM',
    type: 'Life Insurance',
    premium: '$4,800/yr',
    startDate: 'Jan 15, 2026',
    endDate: 'Jan 15, 2027',
    status: 'Active',
    risk: 'Low',
    claims: 0,
    fraudScore: 8,
    email: 'olivia.m@email.com',
    phone: '+1 (555) 234-6789',
    coverageAmount: '$750,000',
  },
  {
    id: 'POL-10050',
    holder: 'James Wilson',
    initials: 'JW',
    type: 'Liability Plus',
    premium: '$920/yr',
    startDate: 'Feb 22, 2026',
    endDate: 'Feb 22, 2027',
    status: 'Suspended',
    risk: 'High',
    claims: 6,
    fraudScore: 96,
    email: 'jwilson@email.com',
    phone: '+1 (555) 543-9988',
    coverageAmount: '$100,000',
  },
  {
    id: 'POL-10051',
    holder: 'Priya Patel',
    initials: 'PP',
    type: 'Health & Dental',
    premium: '$2,160/yr',
    startDate: 'Mar 8, 2026',
    endDate: 'Mar 8, 2027',
    status: 'Active',
    risk: 'Low',
    claims: 1,
    fraudScore: 22,
    email: 'priya.p@email.com',
    phone: '+1 (555) 876-4321',
    coverageAmount: '$300,000',
  },
];

const RISK_CONFIG = {
  Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  icon: ShieldCheck },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', icon: Shield },
  High:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)',  icon: ShieldAlert },
};

const STATUS_CONFIG = {
  Active:       { color: '#10b981', dot: '#10b981' },
  'Under Review': { color: '#f59e0b', dot: '#f59e0b' },
  Suspended:    { color: '#f43f5e', dot: '#f43f5e' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #f5550f, #ff8a50)',
  'linear-gradient(135deg, #f43f5e, #ff5252)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #f5550f)',
  'linear-gradient(135deg, #06b6d4, #f5550f)',
];

const SUMMARY_STATS = [
  { label: 'Active Policies', value: '4,218', Icon: ShieldCheck, color: '#10b981' },
  { label: 'Total Covered', value: '$48.2M', Icon: BarChart3, color: '#f5550f' },
  { label: 'High Risk', value: '137', Icon: ShieldAlert, color: '#f43f5e' },
  { label: 'Renewals Due', value: '29', Icon: Clock, color: '#f59e0b' },
];

export default function Policies() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [expandedCard, setExpandedCard] = useState(null);

  const filtered = policies.filter(p => {
    const matchSearch =
      p.holder.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'All' || p.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="space-y-8 pb-14">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              Policy Registry
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
            Policy{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #ff8a50, #ff5252)' }}>
              Holders
            </span>
          </h1>
          <p className="text-[color:var(--text-muted)] mt-1.5 font-medium">
            Monitor risk levels and manage all active insurance policies.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-3">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #ff8a50, #f5550f)', boxShadow: '0 8px 32px rgba(255,138,80,0.4)' }}
          >
            <Plus className="w-4 h-4" /> Add Policy
          </button>
        </motion.div>
      </div>

      {/* ── Summary Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {SUMMARY_STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.07 }}
            whileHover={{ y: -3 }}
            className="flex items-center gap-4 rounded-2xl px-5 py-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="p-2 rounded-xl" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.Icon style={{ width: 16, height: 16, color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-black text-[color:var(--text-main)] leading-none">{s.value}</p>
              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search policies, holders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium text-[color:var(--text-main)] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          {['All', 'Low', 'Medium', 'High'].map(r => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={
                riskFilter === r
                  ? { background: 'linear-gradient(135deg, #ff8a50, #f5550f)', color: '#fff', boxShadow: '0 4px 16px rgba(255,138,80,0.35)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)', color: '#64748b' }
              }
            >
              {r} Risk
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Policy Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((policy, i) => {
            const riskCfg = RISK_CONFIG[policy.risk];
            const statusCfg = STATUS_CONFIG[policy.status] || STATUS_CONFIG['Active'];
            const RiskIcon = riskCfg.icon;
            const isExpanded = expandedCard === policy.id;
            const gradIdx = parseInt(policy.id.replace('POL-', ''), 10) % AVATAR_GRADIENTS.length;

            return (
              <motion.div
                key={policy.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -5 }}
                onClick={() => setExpandedCard(isExpanded ? null : policy.id)}
                className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)', border: '1px solid var(--border-card)', boxShadow: isExpanded ? '0 0 40px rgba(255,138,80,0.15), 0 20px 60px rgba(0,0,0,0.3)' : 'none' }}
              >
                {/* Animated top border */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${riskCfg.color}60, transparent)` }}
                />
                {/* Glow blob */}
                <div
                  className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                  style={{ background: riskCfg.color }}
                />

                {/* Card top row */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-[color:var(--text-main)] shrink-0 shadow-lg"
                      style={{ background: AVATAR_GRADIENTS[gradIdx] }}
                    >
                      {policy.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[color:var(--text-main)] leading-snug">{policy.holder}</p>
                      <p className="text-[11px] font-mono text-slate-600">{policy.id}</p>
                    </div>
                  </div>
                  {/* Status dot */}
                  <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold" style={{ color: statusCfg.color, background: `${statusCfg.color}15`, border: `1px solid ${statusCfg.color}30` }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: statusCfg.dot }} />
                    {policy.status}
                  </div>
                </div>

                {/* Policy Info */}
                <div className="relative z-10 space-y-2.5">
                  <div className="text-xs font-semibold text-[color:var(--text-muted)] px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
                    {policy.type}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
                      <p className="text-slate-600 font-semibold mb-0.5">Premium</p>
                      <p className="text-[color:var(--text-main)] font-bold">{policy.premium}</p>
                    </div>
                    <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
                      <p className="text-slate-600 font-semibold mb-0.5">Coverage</p>
                      <p className="text-[color:var(--text-main)] font-bold">{policy.coverageAmount}</p>
                    </div>
                  </div>

                  {/* Risk level */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold" style={{ color: riskCfg.color, background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}>
                      <RiskIcon style={{ width: 12, height: 12 }} /> {policy.risk} Risk
                    </span>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-600 font-medium">Fraud Score</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${policy.fraudScore}%` }}
                            transition={{ delay: 0.4 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: riskCfg.color, boxShadow: `0 0 6px ${riskCfg.color}99` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: riskCfg.color }}>{policy.fraudScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="relative z-10 overflow-hidden"
                    >
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-card)' }}>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
                            <Mail style={{ width: 12, height: 12 }} />
                            <span>{policy.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
                            <Phone style={{ width: 12, height: 12 }} />
                            <span>{policy.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
                            <FileText style={{ width: 12, height: 12 }} />
                            <span>{policy.claims} claim{policy.claims !== 1 ? 's' : ''} filed</span>
                          </div>
                          <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
                            <Clock style={{ width: 12, height: 12 }} />
                            <span>Valid until {policy.endDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={e => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-orange-500 hover:text-orange-300 transition-colors"
                            style={{ background: 'rgba(245,85,15,0.1)', border: '1px solid rgba(245,85,15,0.2)' }}
                          >
                            <Eye style={{ width: 12, height: 12 }} /> View Details
                          </button>
                          <button
                            onClick={e => e.stopPropagation()}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
                          >
                            <ShieldCheck style={{ width: 12, height: 12 }} /> Review
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand hint */}
                <div className="relative z-10 mt-3 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
          <Users className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-[color:var(--text-muted)] font-bold">No policies found.</p>
          <p className="text-slate-700 text-sm mt-1">Try adjusting your search or filter.</p>
        </motion.div>
      )}
    </div>
  );
}
