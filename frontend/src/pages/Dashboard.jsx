import React, { useState, useMemo } from 'react';
import { RadialBarChart, RadialBar, Cell, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, Fingerprint, BrainCircuit, ScanLine, Activity, Eye, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowingChart from '../components/GlowingChart';
import { downloadCsv } from '../utils/export';

// â”€â”€ Chart datasets â€” {x, y, label} â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CHART_DATA = {
  week: {
    safe:  [
      { x:0, y:240, label:'Mon' }, { x:1, y:139, label:'Tue' }, { x:2, y:380, label:'Wed' },
      { x:3, y:290, label:'Thu' }, { x:4, y:380, label:'Fri' }, { x:5, y:290, label:'Sat' }, { x:6, y:430, label:'Sun' },
    ],
    fraud: [
      { x:0, y:40,  label:'Mon' }, { x:1, y:30,  label:'Tue' }, { x:2, y:20,  label:'Wed' },
      { x:3, y:60,  label:'Thu' }, { x:4, y:45,  label:'Fri' }, { x:5, y:80,  label:'Sat' }, { x:6, y:35,  label:'Sun' },
    ],
  },
  year: {
    safe:  [
      { x:0, y:980,  label:'Jan' }, { x:1, y:1240, label:'Feb' }, { x:2, y:1060, label:'Mar' },
      { x:3, y:1430, label:'Apr' }, { x:4, y:1100, label:'May' }, { x:5, y:1600, label:'Jun' },
      { x:6, y:1700, label:'Jul' }, { x:7, y:1550, label:'Aug' }, { x:8, y:1800, label:'Sep' },
      { x:9, y:1900, label:'Oct' }, { x:10, y:1750, label:'Nov' }, { x:11, y:2100, label:'Dec' },
    ],
    fraud: [
      { x:0, y:120,  label:'Jan' }, { x:1, y:185,  label:'Feb' }, { x:2, y:140,  label:'Mar' },
      { x:3, y:210,  label:'Apr' }, { x:4, y:170,  label:'May' }, { x:5, y:230,  label:'Jun' },
      { x:6, y:190,  label:'Jul' }, { x:7, y:250,  label:'Aug' }, { x:8, y:220,  label:'Sep' },
      { x:9, y:280,  label:'Oct' }, { x:10, y:260,  label:'Nov' }, { x:11, y:310,  label:'Dec' },
    ],
  },
};

const fraudTypes = [
  { name: 'Claim Inflation', value: 38, fill: '#6366f1' },
  { name: 'Identity Theft', value: 27, fill: '#f43f5e' },
  { name: 'Doc Forgery', value: 19, fill: '#f59e0b' },
  { name: 'Premium Fraud', value: 16, fill: '#10b981' },
];

const DASHBOARD_STATS = [
  { label: "Claims Analyzed", value: "284k", trend: "+14.2%", subtext: "This month", icon: ScanLine, gradient: "bg-indigo-500" },
  { label: "Threats Stopped", value: "1,842", trend: "+5.4%", subtext: "AI-blocked", icon: ShieldCheck, gradient: "bg-emerald-500" },
  { label: "Critical Alerts", value: "156", trend: "-2.1%", subtext: "Needs action", icon: AlertTriangle, gradient: "bg-rose-500" },
  { label: "Policies Scanned", value: "89.4k", trend: "+1.2%", subtext: "Active today", icon: Fingerprint, gradient: "bg-violet-500" },
];
const liveFeed = [
  { id: 1, text: 'Critical claim flagged â€” $42k submission', time: 'Just now', type: 'critical' },
  { id: 2, text: 'Identity mismatch on Policy #A89', time: '2 min ago', type: 'warning' },
  { id: 3, text: '14 claims verified successfully', time: '5 min ago', type: 'success' },
  { id: 4, text: 'Geo-anomaly detected on mobile login', time: '12 min ago', type: 'warning' },
  { id: 5, text: 'New batch of 220 claims ingested', time: '18 min ago', type: 'info' },
];

const StatCard = ({ title, value, subtext, trend, icon: Icon, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="relative overflow-hidden rounded-2xl p-6 cursor-pointer group"
    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
  >
    {/* Glow blob */}
    <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity duration-700 ${gradient}`} />
    {/* Top shimmer line */}
    <div className={`absolute top-0 left-0 right-0 h-[1px] ${gradient} opacity-40`} />

    <div className="flex items-start justify-between mb-5 relative z-10">
      <div className={`p-2.5 rounded-xl bg-white/5 ring-1 ring-white/10 ${gradient.replace('bg-', 'text-').split(' ')[0]}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend.startsWith('+') ? 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20'}`}>
        {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {trend}
      </span>
    </div>

    <p className="text-4xl font-black text-white tracking-tight relative z-10">{value}</p>
    <p className="text-sm font-semibold text-slate-400 mt-1 relative z-10">{title}</p>
    {subtext && <p className="text-xs text-slate-600 mt-0.5 relative z-10">{subtext}</p>}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,18,40,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 16px' }}>
        <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>{p.name}: <span style={{ color: '#fff' }}>{p.value}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState('week');
  const chartDataA = CHART_DATA[chartPeriod].safe;
  const chartDataB = CHART_DATA[chartPeriod].fraud;

  const handleGenerateReport = () => {
    const rows = [
      ...DASHBOARD_STATS.map((s) => ({ section: 'stats', name: s.label, value: s.value, trend: s.trend })),
      ...fraudTypes.map((f) => ({ section: 'fraud_types', name: f.name, value: f.value })),
      ...liveFeed.map((l) => ({ section: 'live_feed', name: l.text, value: l.time, type: l.type })),
    ];
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`fraud_report_${date}.csv`, rows);
  };

  return (
    <div className="space-y-8 pb-14">
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
              Live Monitoring
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Security Intelligence{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}>Center</span>
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">Real-time fraud analytics, anomaly detection and threat response</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex gap-3">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}
          >
            <Zap className="w-4 h-4" /> Generate Report
          </button>
        </motion.div>
      </div>

      {/* â”€â”€ Stat Cards â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_STATS.map((s, i) => (
          <StatCard
            key={s.label}
            title={s.label}
            value={s.value}
            trend={s.trend}
            subtext={s.subtext}
            icon={s.icon}
            gradient={s.gradient}
            delay={0.1 + i * 0.1}
          />
        ))}
      </div>

      {/* â”€â”€ Middle Row â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Glowing Neon Chart (2/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }}
          className="col-span-1 lg:col-span-2 relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(4,4,24,0.98) 0%, rgba(8,6,32,0.96) 100%)',
            border: '1px solid rgba(56,189,248,0.12)',
            boxShadow: '0 0 80px rgba(56,189,248,0.07), 0 0 40px rgba(244,113,181,0.05), inset 0 0 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Ambient corner glows â€” more vivid */}
          <div className="absolute -left-12 bottom-4 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 65%)' }} />
          <div className="absolute -right-8 -top-4 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(244,113,181,0.12) 0%, transparent 65%)' }} />
          <div className="absolute left-1/2 bottom-0 w-48 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />

          <div className="flex items-center justify-between mb-1 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Detection Volume</h2>
              <p className="text-xs text-slate-600 mt-0.5">Fraudulent vs. legitimate claim flow</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" /> Live
              </span>
              {/* Period pill buttons */}
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[{ id: 'week', label: 'This Week' }, { id: 'year', label: 'This Year' }].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setChartPeriod(p.id)}
                    className="px-3 py-1.5 text-xs font-bold transition-all"
                    style={
                      chartPeriod === p.id
                        ? { background: 'linear-gradient(135deg,#38bdf8,#6366f1)', color: '#fff', boxShadow: 'inset 0 0 12px rgba(56,189,248,0.25)' }
                        : { color: '#64748b' }
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={chartPeriod}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.25,0.46,0.45,0.94] }}
            >
              <GlowingChart
                dataA={chartDataA}
                dataB={chartDataB}
                labelA="Legitimate"
                labelB="Fraudulent"
                colorA="#38bdf8"
                colorB="#f471b5"
                height={285}
                live={true}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Fraud Breakdown + Live Feed stacked */}
        <div className="flex flex-col gap-5">
          {/* Fraud Type Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-2xl p-6 flex-1"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <h2 className="text-sm font-bold text-white mb-4">Fraud Type Breakdown</h2>
            <div className="space-y-3">
              {fraudTypes.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-400">{f.name}</span>
                    <span className="text-white font-bold">{f.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.value}%` }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: f.fill, boxShadow: `0 0 10px ${f.fill}66` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* AI Score Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg, #1e1145 0%, #0f0c29 100%)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 40px rgba(99,102,241,0.1)' }}
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-violet-600/20 blur-3xl rounded-full"></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <BrainCircuit className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-bold text-white">AI Engine Score</span>
            </div>
            <div className="flex items-end gap-3 relative z-10">
              <span className="text-5xl font-black text-white">99.4<span className="text-2xl text-violet-400">%</span></span>
              <span className="text-xs text-emerald-400 font-bold mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +0.3% vs last week</span>
            </div>
            <div className="mt-3 w-full h-2 rounded-full relative z-10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full" style={{ width: '99.4%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }} />
            </div>
            <p className="text-xs text-slate-500 mt-2 relative z-10">Model accuracy on latest claim batch</p>
          </motion.div>
        </div>
      </div>

      {/* â”€â”€ Live Activity Feed â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Live Threat Feed</h2>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block" /> Live
            </span>
          </div>
          <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium flex items-center gap-1">
            View all <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <AnimatePresence>
            {liveFeed.map((feed, i) => (
              <motion.div
                key={feed.id}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + i * 0.08 }}
                whileHover={{ scale: 1.03 }}
                className="rounded-xl p-4 cursor-pointer transition-colors group"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className={`w-2 h-2 rounded-full mb-3 ${
                  feed.type === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                  feed.type === 'warning' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' :
                  feed.type === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' :
                  'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                } animate-pulse`} />
                <p className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-relaxed">{feed.text}</p>
                <p className="text-[10px] text-slate-600 mt-2 font-medium">{feed.time}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
