import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, AlertCircle, AlertTriangle, Eye, ShieldCheck, MoreVertical, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlertsPaginated, resolveAlert } from '../utils/api';

const RiskBadge = ({ score }) => {
  if (score >= 90) return (
    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-300" style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)', boxShadow: '0 0 12px rgba(244,63,94,0.15)' }}>
      <AlertCircle className="w-3 h-3" /> Critical · {score}
    </span>
  );
  if (score >= 80) return (
    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-300" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 12px rgba(245,158,11,0.1)' }}>
      <AlertTriangle className="w-3 h-3" /> High · {score}
    </span>
  );
  return (
    <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-300" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <ShieldAlert className="w-3 h-3" /> Medium · {score}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const s = {
    OPEN: { color: '#ff8a50', bg: 'rgba(245,85,15,0.12)', border: 'rgba(245,85,15,0.25)', dot: '#f5550f', label: 'Open' },
    REVIEWING: { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b', label: 'Reviewing' },
    RESOLVED: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', dot: '#10b981', label: 'Resolved' },
  }[(status || '').toUpperCase()] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', dot: '#94a3b8', label: status };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

export default function FraudAlerts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 5;

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAlertsPaginated(skip, limit);
      setAlerts(data.alerts || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [skip]);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Aggregated Summary Stats for the Chips
  const stats = {
    open: alerts.filter(a => a.status === 'OPEN').length + (total > alerts.length ? total - alerts.length : 0),
    reviewing: alerts.filter(a => a.status === 'REVIEWING').length,
    resolved: 12 + alerts.filter(a => a.status === 'RESOLVED').length, // 12 is baseline history
    avgScore: alerts.length > 0 ? (alerts.reduce((acc, a) => acc + (a.risk_score || 0), 0) / alerts.length).toFixed(1) : '0.0'
  };

  const filtered = alerts.filter(a =>
    (a.policy_holder && a.policy_holder.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.id && a.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.fraud_type && a.fraud_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" /> Alert Queue Active
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
            Fraud{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f43f5e, #f59e0b)' }}>Alert Center</span>
          </h1>
          <p className="text-[color:var(--text-muted)] mt-1.5 font-medium">Investigate AI-flagged threats and respond in real-time.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search alerts, IDs, or fraud types …"
              className="pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium text-[color:var(--text-main)] placeholder-slate-600 w-full focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 rounded-xl text-[color:var(--text-muted)] hover:text-orange-500 transition-colors" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
            <Filter className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Summary chips */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
        {[
          { label: 'Open Alerts', count: stats.open, color: '#ff8a50' },
          { label: 'Under Review', count: stats.reviewing, color: '#fcd34d' },
          { label: 'Resolved Today', count: stats.resolved, color: '#10b981' },
          { label: 'Avg Risk Score', count: stats.avgScore, color: '#f43f5e' },
        ].map((chip) => (
          <div key={chip.label} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer hover:opacity-80 transition-opacity"
            style={{ background: `${chip.color}18`, border: `1px solid ${chip.color}30`, color: chip.color }}>
            <span className="text-lg font-black" style={{ color: '#fff' }}>{chip.count}</span>
            <span className="text-xs font-semibold text-[color:var(--text-muted)]">{chip.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,85,15,0.4), transparent)' }} />

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)' }}>
                {['Alert / Claim', 'Policyholder', 'Fraud Category', 'Risk Score', 'AI Confidence', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody>
              <AnimatePresence>
                {filtered.map((alert, i) => (
                  <motion.tr
                    key={alert.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
                    onMouseEnter={() => setHoveredRow(alert.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="group cursor-pointer transition-colors duration-150"
                    style={{ borderBottom: '1px solid var(--border-card)', background: hoveredRow === alert.id ? 'var(--bg-card-hover)' : 'transparent' }}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="font-bold text-orange-500 text-sm">{alert.id}</div>
                      <div className="text-xs text-[color:var(--text-muted)] mt-0.5 font-medium">{alert.claim_id}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, #f5550f, #ff8a50)` }}>
                          {alert.policy_holder ? alert.policy_holder.split(' ').map(n => n[0]).join('') : '?'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[color:var(--text-main)]">{alert.policy_holder}</div>
                          <div className="text-xs font-semibold mt-0.5" style={{ color: '#f59e0b' }}>
                            Claim: {alert.amount ? `₹${Number(alert.amount).toLocaleString('en-IN')} L` : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-xs font-bold text-[color:var(--text-muted)] px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
                        {alert.fraud_type}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <RiskBadge score={alert.risk_score} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${alert.risk_score}%` }}
                            transition={{ delay: 0.3 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              background: alert.risk_score >= 90 ? 'linear-gradient(90deg, #f5550f, #ff8a50)' : 'linear-gradient(90deg, #64748b, #94a3b8)',
                              boxShadow: alert.risk_score >= 90 ? '0 0 8px rgba(245,85,15,0.5)' : 'none'
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[color:var(--text-muted)] w-9 text-right">{alert.risk_score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap"><StatusPill status={alert.status} /></td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <AnimatePresence>
                        {hoveredRow === alert.id ? (
                          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="flex justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); window.alert(`Investigating details for Alert ${alert.id}\nFraud Type: ${alert.fraud_type}\nScore: ${alert.risk_score}`); }}
                              className="p-2 rounded-lg text-orange-500 hover:text-orange-300 transition-colors cursor-pointer" title="Investigate"
                              style={{ background: 'rgba(245,85,15,0.12)' }}>
                              <Eye className="w-4 h-4 pointer-events-none" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                              className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer" title="Mark Safe"
                              style={{ background: 'rgba(16,185,129,0.12)' }}>
                              <ShieldCheck className="w-4 h-4 pointer-events-none" />
                            </button>
                          </motion.div>
                        ) : (
                          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-2 rounded-lg text-slate-600 hover:text-[color:var(--text-muted)] transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--border-card)' }}>
          <p className="text-xs font-medium text-slate-600">Showing <span className="font-bold text-[color:var(--text-muted)]">{alerts.length > 0 ? skip + 1 : 0}–{Math.min(skip + limit, total)}</span> of <span className="font-bold text-[color:var(--text-muted)]">{total}</span> alerts</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0}
              className="px-4 py-2 text-xs font-bold text-[color:var(--text-muted)] rounded-xl transition-colors hover:text-[color:var(--text-main)] disabled:opacity-50 cursor-pointer"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>← Previous</button>
            <button 
              onClick={() => setSkip(skip + limit)}
              disabled={skip + limit >= total}
              className="px-4 py-2 text-xs font-bold text-[color:var(--text-main)] rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #f5550f, #ff8a50)', boxShadow: '0 4px 16px rgba(245,85,15,0.3)' }}>Next →</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
