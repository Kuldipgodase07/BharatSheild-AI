import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, Activity, Download,
  ArrowUpRight, ArrowDownRight, Globe, Shield,
  Target, Zap, CheckCircle2,
  Calendar, ChevronDown, X, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell,
  ReferenceLine, ReferenceDot
} from 'recharts';
import { getAnalytics, verifyDocument } from '../utils/api';
import { downloadCsv } from '../utils/export';

// ─── Generate realistic data for any range ──────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// Seed-based pseudo-random so past hours are stable per session
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildTodayData(liveMinute) {
  const now = new Date();
  const currentHour = now.getHours();
  const minuteFraction = now.getMinutes() / 60;

  return Array.from({ length: 24 }, (_, h) => {
    const label = `${h.toString().padStart(2,'0')}:00`;
    const baseClaims = Math.round(10 + seededRand(h * 3) * 18);
    const baseFraud  = Math.round(1  + seededRand(h * 7) * 5);

    if (h < currentHour) {
      // Past hours — solid historical data
      return {
        label,
        actual_claims: baseClaims,
        actual_fraud:  baseFraud,
        predict_claims: null,
        predict_fraud:  null,
        revenue: +(0.5 + seededRand(h * 11) * 2).toFixed(1),
        type: 'past',
      };
    } else if (h === currentHour) {
      // Current hour — live partial value (grows with minute)
      const liveClaims = Math.round(baseClaims * minuteFraction + seededRand(liveMinute) * 3);
      const liveFraud  = Math.round(baseFraud  * minuteFraction + seededRand(liveMinute * 2) * 1);
      return {
        label,
        actual_claims: liveClaims,
        actual_fraud:  liveFraud,
        predict_claims: baseClaims,   // show full prediction behind
        predict_fraud:  baseFraud,
        revenue: +(liveClaims * 0.08).toFixed(1),
        type: 'live',
      };
    } else {
      // Future hours — prediction only (dashed)
      const trend = 1 + (h - currentHour) * 0.02; // slight upward trend
      return {
        label,
        actual_claims: null,
        actual_fraud:  null,
        predict_claims: Math.round(baseClaims * trend),
        predict_fraud:  Math.round(baseFraud  * trend),
        revenue: null,
        type: 'future',
      };
    }
  });
}

function buildData(preset, liveMinute = 0) {
  if (preset === 'TODAY') {
    return buildTodayData(liveMinute);
  }
  if (preset === '1W') {
    return DAYS.map(d => ({
      label: d,
      claims:  Math.round(80 + Math.random() * 80),
      fraud:   Math.round(8 + Math.random() * 20),
      approved:Math.round(60 + Math.random() * 60),
      revenue: +(3 + Math.random() * 5).toFixed(1),
    }));
  }
  if (preset === '1M') {
    return Array.from({ length: 30 }, (_, i) => ({
      label: `${i+1}`,
      claims:  Math.round(30 + Math.random() * 40),
      fraud:   Math.round(2 + Math.random() * 10),
      approved:Math.round(20 + Math.random() * 35),
      revenue: +(1 + Math.random() * 3).toFixed(1),
    }));
  }
  if (preset === '3M') {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (11 - i) * 7);
      return {
        label: `W${i+1}`,
        claims:  Math.round(200 + Math.random() * 200),
        fraud:   Math.round(15 + Math.random() * 40),
        approved:Math.round(150 + Math.random() * 160),
        revenue: +(8 + Math.random() * 12).toFixed(1),
      };
    });
  }
  if (preset === '6M') {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now); d.setMonth(d.getMonth() - (5 - i));
      return {
        label: MONTHS[d.getMonth()],
        claims:  Math.round(800 + Math.random() * 400),
        fraud:   Math.round(55 + Math.random() * 80),
        approved:Math.round(650 + Math.random() * 320),
        revenue: +(40 + Math.random() * 30).toFixed(1),
      };
    });
  }
  if (preset === '1Y') {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setMonth(d.getMonth() - (11 - i));
      return {
        label: MONTHS[d.getMonth()],
        claims:  Math.round(900 + Math.random() * 500),
        fraud:   Math.round(60 + Math.random() * 100),
        approved:Math.round(700 + Math.random() * 400),
        revenue: +(45 + Math.random() * 35).toFixed(1),
      };
    });
  }
  // Custom month-year
  const [year, month] = preset.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, i) => ({
    label: `${i+1}`,
    claims:  Math.round(25 + Math.random() * 50),
    fraud:   Math.round(2 + Math.random() * 12),
    approved:Math.round(18 + Math.random() * 40),
    revenue: +(1 + Math.random() * 4).toFixed(1),
  }));
}

const FRAUD_CATS = [
  { name: 'Claim Inflation', value: 38, color: '#f5550f' },
  { name: 'Identity Theft',  value: 27, color: '#f43f5e' },
  { name: 'Doc Forgery',     value: 19, color: '#f59e0b' },
  { name: 'Premium Fraud',   value: 16, color: '#10b981' },
];

const REGIONAL = [
  { region: 'Mumbai',    risk: 88, claims: 234 },
  { region: 'Delhi',     risk: 72, claims: 198 },
  { region: 'Bangalore', risk: 45, claims: 167 },
  { region: 'Chennai',   risk: 61, claims: 143 },
  { region: 'Hyderabad', risk: 54, claims: 122 },
  { region: 'Pune',      risk: 38, claims:  97 },
];

const WEEKLY_ACC = [
  { day:'Mon', accuracy:98.2 },{ day:'Tue', accuracy:99.1 },
  { day:'Wed', accuracy:98.7 },{ day:'Thu', accuracy:99.4 },
  { day:'Fri', accuracy:98.9 },{ day:'Sat', accuracy:99.6 },
  { day:'Sun', accuracy:99.2 },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(10,12,30,0.98)', border:'1px solid var(--border-card)', borderRadius:12, padding:'10px 14px', backdropFilter:'blur(12px)' }}>
      <p style={{ color:'#94a3b8', fontSize:11, marginBottom:6, fontWeight:700 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontWeight:800, fontSize:13, margin:'2px 0' }}>
          {p.name}: <span style={{ color:'#fff' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Month-Year Picker Dropdown ───────────────────────────────────────────────
function MonthYearPicker({ onSelect, onClose }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  return (
    <motion.div
      initial={{ opacity:0, y:-8, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:-8, scale:0.95 }}
      transition={{ duration:0.18, ease:[0.23,1,0.32,1] }}
      style={{
        position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:9999,
        background:'#140c09', border:'1px solid rgba(245,85,15,0.25)',
        borderRadius:16, padding:20, width:280,
        boxShadow:'0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Year nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button
          onClick={() => setYear(y => y-1)}
          style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color:'#94a3b8', cursor:'pointer', fontSize:16 }}
        >‹</button>
        <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{year}</span>
        <button
          onClick={() => setYear(y => Math.min(y+1, now.getFullYear()))}
          style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color: year >= now.getFullYear() ? '#334155' : '#94a3b8', cursor: year >= now.getFullYear() ? 'not-allowed':'pointer', fontSize:16 }}
        >›</button>
      </div>

      {/* Months grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {MONTHS.map((m, idx) => {
          const isFuture = year === now.getFullYear() && idx > now.getMonth();
          const isCurrentMonth = year === now.getFullYear() && idx === now.getMonth();
          return (
            <button
              key={m}
              disabled={isFuture}
              onClick={() => { onSelect(`${year}-${idx+1}`); onClose(); }}
              style={{
                padding:'8px 0', borderRadius:10, fontSize:12, fontWeight:700,
                cursor: isFuture ? 'not-allowed' : 'pointer',
                transition:'all 0.15s',
                background: isCurrentMonth ? 'linear-gradient(135deg,#f5550f,#ff8a50)' : 'var(--bg-card)',
                border: isCurrentMonth ? 'none' : '1px solid var(--border-card)',
                color: isFuture ? '#334155' : isCurrentMonth ? '#fff' : '#94a3b8',
                boxShadow: isCurrentMonth ? '0 4px 16px rgba(245,85,15,0.4)' : 'none',
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        style={{ marginTop:12, width:'100%', padding:'8px', borderRadius:10, fontSize:11, fontWeight:700, color:'#475569', background:'var(--bg-card)', border:'1px solid var(--border-card)', cursor:'pointer' }}
      >
        Cancel
      </button>
    </motion.div>
  );
}

// ─── Active Range Label ───────────────────────────────────────────────────────
function rangeLabel(preset) {
  if (preset === 'TODAY') return 'Today';
  if (preset === '1W')    return 'Last 7 Days';
  if (preset === '1M')    return 'Last 30 Days';
  if (preset === '3M')    return 'Last 3 Months';
  if (preset === '6M')    return 'Last 6 Months';
  if (preset === '1Y')    return 'Last 12 Months';
  const [year,month] = preset.split('-').map(Number);
  return `${MONTHS[month-1]} ${year}`;
}

// ─── KPIs per range ──────────────────────────────────────────────────────────
function kpis(data) {
  const totalFraud = data.reduce((s,d) => s+d.fraud,0);
  const totalClaims = data.reduce((s,d) => s+d.claims,0);
  const rate = totalClaims ? ((1 - totalFraud/totalClaims)*100).toFixed(1) : '–';
  const revenue = data.reduce((s,d) => s+d.revenue, 0).toFixed(1);
  return [
    { label:'Detection Rate',    value:`${rate}%`,  change:'+2.1%', up:true,  icon:Target,       gradient:'from-orange-600 to-amber-500', desc:'fraud caught by AI' },
    { label:'False Positives',   value:'0.6%',      change:'-0.3%', up:true,  icon:CheckCircle2, gradient:'from-emerald-500 to-teal-500', desc:'misclassification rate' },
    { label:'Avg Response Time', value:'1.4s',      change:'-0.2s', up:true,  icon:Zap,          gradient:'from-amber-500 to-orange-500', desc:'per claim analysis' },
    { label:'Revenue Saved',     value:`₹${revenue}L`, change:'+12%', up:true, icon:Shield,      gradient:'from-rose-500 to-pink-500', desc:'fraud prevented' },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [preset, setPreset] = useState('6M');
  const [showPicker, setShowPicker] = useState(false);
  const [docImagePath, setDocImagePath] = useState('');
  const [docReferencePath, setDocReferencePath] = useState('');
  const [docResult, setDocResult] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [liveMinute, setLiveMinute] = useState(0); // ticks every minute to refresh TODAY
  const [liveTime, setLiveTime] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const pickerRef = useRef(null);

  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      if (data) {
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPicker]);

  // Live clock + minute ticker for TODAY mode
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
      setLiveMinute(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const data = useMemo(() => buildData(preset, liveMinute), [preset, liveMinute]);
  const kpiCards = useMemo(() => {
    if (analyticsData) {
      // Use real analytics data from backend
      return [
        {
          label: 'Total Claims',
          value: analyticsData.total_claims?.toLocaleString() || '0',
          trend: '+12.3%',
          icon: Activity,
          gradient: 'from-orange-600 to-amber-500',
          glow: 'rgba(245,85,15,0.4)'
        },
        {
          label: 'Approved Claims',
          value: analyticsData.approved_claims?.toLocaleString() || '0',
          trend: '+5.1%',
          icon: CheckCircle2,
          gradient: 'from-emerald-500 to-teal-500',
          glow: 'rgba(16,185,129,0.4)'
        },
        {
          label: 'Pending Review',
          value: analyticsData.pending_claims?.toLocaleString() || '0',
          trend: '-3.2%',
          icon: Calendar,
          gradient: 'from-amber-500 to-orange-500',
          glow: 'rgba(245,158,11,0.4)'
        },
        {
          label: 'AI Flagged Fraud',
          value: analyticsData.flagged_claims?.toLocaleString() || '0',
          trend: '+8.7%',
          icon: Shield,
          gradient: 'from-rose-500 to-pink-500',
          glow: 'rgba(244,63,94,0.4)'
        },
        {
          label: 'Active Policies',
          value: analyticsData.active_policies?.toLocaleString() || '0',
          trend: '+15.2%',
          icon: Target,
          gradient: 'from-cyan-500 to-blue-500',
          glow: 'rgba(6,182,212,0.4)'
        },
        {
          label: 'Total Revenue',
          value: `$${(analyticsData.total_revenue / 1000000)?.toFixed(1) || '0'}M`,
          trend: '+18.9%',
          icon: TrendingUp,
          gradient: 'from-green-500 to-emerald-500',
          glow: 'rgba(34,197,94,0.4)'
        }
      ];
    } else {
      // Fallback to synthetic data
      return kpis(data);
    }
  }, [analyticsData, data]);

  const handleExport = useCallback(() => {
    const columns = [
      'section',
      'label',
      'value',
      'change',
      'up',
      'claims',
      'fraud',
      'approved',
      'revenue',
      'actual_claims',
      'actual_fraud',
      'predict_claims',
      'predict_fraud',
      'type'
    ];

    const toRow = (input) => {
      const row = {};
      columns.forEach((c) => {
        row[c] = input[c] !== undefined ? input[c] : '';
      });
      return row;
    };

    const rows = [
      ...kpiCards.map((k) => toRow({
        section: 'kpi',
        label: k.label,
        value: k.value,
        change: k.trend || k.change,
        up: k.up
      })),
      ...data.map((d) => toRow({
        section: 'series',
        ...d
      }))
    ];

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`analytics_${preset}_${date}.csv`, rows);
  }, [data, kpiCards, preset]);

  const handleVerifyDoc = useCallback(async () => {
    if (!docImagePath) return;
    setDocLoading(true);
    try {
      const result = await verifyDocument(docImagePath, docReferencePath || null);
      setDocResult(result);
    } catch (error) {
      console.error('Document verification failed:', error);
      setDocResult({ error: 'Verification failed' });
    } finally {
      setDocLoading(false);
    }
  }, [docImagePath, docReferencePath]);

  // Derived for TODAY
  const isToday = preset === 'TODAY';
  const currentHour = new Date().getHours();
  const currentHourLabel = `${currentHour.toString().padStart(2,'0')}:00`;

  const PRESETS = [
    { id:'TODAY', label:'Today' },
    { id:'1W',    label:'1W'   },
    { id:'1M',    label:'1M'   },
    { id:'3M',    label:'3M'   },
    { id:'6M',    label:'6M'   },
    { id:'1Y',    label:'1Y'   },
  ];

  const isCustom = !PRESETS.find(p => p.id === preset);

  return (
    <div className="space-y-8 pb-14">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <motion.div initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
              Analytics Center
            </span>
            {analyticsData && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Real Dataset
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
            Fraud{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage:'linear-gradient(90deg,#06b6d4,#f5550f)' }}>
              Analytics
            </span>
          </h1>
          <p className="text-[color:var(--text-muted)] mt-1.5 font-medium">AI-powered fraud intelligence, patterns and financial impact.</p>

          {/* Current range badge */}
          <div className="flex items-center gap-2 mt-3">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-bold text-orange-300">{rangeLabel(preset)}</span>
            {isCustom && (
              <button onClick={() => setPreset('6M')} className="text-[10px] text-slate-600 hover:text-rose-400 transition-colors ml-1">
                <X className="w-3 h-3 inline" /> clear
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Date Range Controls ── */}
        <motion.div initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} className="flex items-center gap-3 flex-wrap">

          {/* Quick presets */}
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
          >
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className="px-4 py-2.5 text-xs font-bold transition-all"
                style={
                  preset === p.id
                    ? { background:'linear-gradient(135deg,#f5550f,#ff8a50)', color:'#fff', boxShadow:'inset 0 0 20px rgba(245,85,15,0.3)' }
                    : { color:'#64748b' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month/Year picker button */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isCustom || showPicker ? 'linear-gradient(135deg,#f5550f,#ff8a50)' : 'var(--bg-card)',
                border: isCustom || showPicker ? '1px solid rgba(245,85,15,0.4)' : '1px solid var(--border-card)',
                color: isCustom || showPicker ? '#fff' : '#94a3b8',
                boxShadow: isCustom || showPicker ? '0 4px 20px rgba(245,85,15,0.35)' : 'none',
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {isCustom ? rangeLabel(preset) : 'Pick Month'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showPicker && (
                <MonthYearPicker
                  onSelect={(v) => setPreset(v)}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Data */}
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[color:var(--text-main)] hover:text-white transition-all disabled:opacity-50"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
          >
            <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background:'linear-gradient(135deg,#f5550f,#ff8a50)', boxShadow:'0 6px 24px rgba(245,85,15,0.4)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </motion.div>
      </div>

      {/* â”€â”€ Document Verification Widget â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-5"
        style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-[color:var(--text-main)]">Forgery Detection</h3>
            <p className="text-xs text-slate-600">Verify documents and signatures (server file paths)</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            Live
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <input
            value={docImagePath}
            onChange={e => setDocImagePath(e.target.value)}
            placeholder="Document image path"
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[color:var(--text-main)] placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
          />
          <input
            value={docReferencePath}
            onChange={e => setDocReferencePath(e.target.value)}
            placeholder="Reference image path (optional)"
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[color:var(--text-main)] placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
          />
          <button
            onClick={handleVerifyDoc}
            disabled={!docImagePath || docLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#f5550f,#ff8a50)', boxShadow:'0 6px 24px rgba(245,85,15,0.4)' }}
          >
            {docLoading ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Verify
          </button>
        </div>
        {docResult && !docResult.error && (
          <div className="text-[11px] text-[color:var(--text-muted)] mt-3">
            Risk: <span className="text-emerald-400 font-bold">{docResult.risk_score ?? 'N/A'}</span> ·
            Status: <span className="text-orange-300 font-bold">{docResult.is_fraud === null ? 'Unknown' : docResult.is_fraud ? 'Fraud' : 'Legit'}</span>
          </div>
        )}
        {docResult?.error && (
          <div className="text-[11px] text-rose-400 font-bold mt-3">{docResult.error}</div>
        )}
      </motion.div>

      {/* ── KPI Cards ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={preset}
          initial={{ opacity:0, y:16 }}
          animate={{ opacity:1, y:0 }}
          exit={{ opacity:0, y:-16 }}
          transition={{ duration:0.35 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity:0, y:20, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ delay:i*0.07, type:'spring', stiffness:140 }}
              whileHover={{ y:-5, scale:1.02 }}
              className="relative overflow-hidden rounded-2xl p-5 group cursor-pointer"
              style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)', border:'1px solid var(--border-card)' }}
            >
              <div className={`absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 bg-gradient-to-br ${kpi.gradient}`} />
              <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${kpi.gradient} opacity-50`} />
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="p-2 rounded-xl bg-white/5 ring-1 ring-white/10">
                  <kpi.icon className="w-4 h-4 text-[color:var(--text-main)]" />
                </div>
                <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${kpi.up ? 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20' : 'text-rose-400 bg-rose-500/10 ring-1 ring-rose-500/20'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-3xl font-black text-[color:var(--text-main)] tracking-tight relative z-10">{kpi.value}</p>
              <p className="text-xs font-semibold text-[color:var(--text-muted)] mt-0.5 relative z-10">{kpi.label}</p>
              <p className="text-[10px] text-slate-700 mt-0.5 relative z-10">{kpi.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Main Chart + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Claims vs Fraud Chart */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`chart-${preset}`}
            initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ delay:0.15, duration:0.5 }}
            className="lg:col-span-2 relative overflow-hidden rounded-2xl p-6"
            style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
          >
            <div className="absolute -left-16 bottom-0 w-56 h-56 bg-orange-600/8 blur-3xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h2 className="text-base font-bold text-[color:var(--text-main)] flex items-center gap-2">
                  Claims vs Fraud —
                  <span className="text-orange-500">{rangeLabel(preset)}</span>
                  {isToday && (
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Live
                    </span>
                  )}
                </h2>
                {isToday
                  ? <p className="text-xs text-slate-600 mt-0.5">Solid = actual · Dashed = AI prediction · Current time: <span className="text-orange-500 font-mono font-bold">{liveTime}</span></p>
                  : <p className="text-xs text-slate-600 mt-0.5">Volume trend for the selected period</p>
                }
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {isToday ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] font-medium"><span className="w-5 h-1 rounded bg-orange-600 inline-block" /> Actual</div>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] font-medium">
                      <span className="inline-block" style={{ width:20, height:2, background:'repeating-linear-gradient(90deg,#ff8a50 0,#ff8a50 4px,transparent 4px,transparent 8px)' }} /> Predicted
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] font-medium"><span className="w-3 h-3 rounded-full bg-orange-600 inline-block" /> Claims</div>
                    <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] font-medium"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Fraud</div>
                  </>
                )}
              </div>
            </div>

            <div className="h-[280px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                {isToday ? (
                  // TODAY: ComposedChart with solid actual + dashed predicted
                  <ComposedChart data={data} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="aActualClaims" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f5550f" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#f5550f" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="aActualFraud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                      </linearGradient>
                      {/* Future prediction zone — subtle tinted background */}
                      <linearGradient id="predZone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#f5550f" stopOpacity={0.07} />
                        <stop offset="100%" stopColor="#f5550f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:10 }} dy={10} interval={2} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:10 }} />
                    <RechartsTooltip content={<DarkTooltip />} />

                    {/* NOW reference line */}
                    <ReferenceLine
                      x={currentHourLabel}
                      stroke="rgba(245,85,15,0.7)"
                      strokeWidth={2}
                      strokeDasharray="4 2"
                      label={{
                        value: 'NOW',
                        position: 'top',
                        fill: '#ff8a50',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    />

                    {/* Solid actual claims area (past + current) */}
                    <Area
                      type="monotone" dataKey="actual_claims" name="Claims (actual)"
                      stroke="#f5550f" strokeWidth={2.5}
                      fillOpacity={1} fill="url(#aActualClaims)"
                      connectNulls={false}
                      dot={false} activeDot={{ r:5, fill:'#ff8a50' }}
                    />
                    {/* Solid actual fraud */}
                    <Area
                      type="monotone" dataKey="actual_fraud" name="Fraud (actual)"
                      stroke="#f43f5e" strokeWidth={2}
                      fillOpacity={1} fill="url(#aActualFraud)"
                      connectNulls={false}
                      dot={false} activeDot={{ r:5, fill:'#fb7185' }}
                    />
                    {/* Dashed predicted claims line */}
                    <Line
                      type="monotone" dataKey="predict_claims" name="Claims (predicted)"
                      stroke="#ff8a50" strokeWidth={1.5}
                      strokeDasharray="6 4"
                      dot={false} activeDot={{ r:4 }}
                      connectNulls={false}
                    />
                    {/* Dashed predicted fraud line */}
                    <Line
                      type="monotone" dataKey="predict_fraud" name="Fraud (predicted)"
                      stroke="#fb7185" strokeWidth={1.5}
                      strokeDasharray="6 4"
                      dot={false} activeDot={{ r:4 }}
                      connectNulls={false}
                    />
                  </ComposedChart>
                ) : (
                  // Other ranges: regular area chart
                  <AreaChart data={data} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="aClaims" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f5550f" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f5550f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aFraud" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} dy={10}
                      interval={preset==='1M' ? Math.floor(data.length/8) : 0}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} />
                    <RechartsTooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="claims" name="Claims" stroke="#f5550f" strokeWidth={2.5} fillOpacity={1} fill="url(#aClaims)" />
                    <Area type="monotone" dataKey="fraud"  name="Fraud"  stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#aFraud)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Footer legend for TODAY */}
            {isToday && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-[color:var(--text-muted)]">
                    Past: <span className="text-[color:var(--text-main)]">{currentHour}h</span> recorded ·
                    Remaining: <span className="text-orange-500">{23 - currentHour}h predicted</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-700">Updates every second</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Fraud Donut */}
        <motion.div
          initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.3 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
        >
          <h2 className="text-base font-bold text-[color:var(--text-main)] mb-1">Fraud Categories</h2>
          <p className="text-xs text-slate-600 mb-4">Distribution by fraud type</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={FRAUD_CATS} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value"
                  onMouseEnter={(_,idx) => setActiveCategory(idx)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  {FRAUD_CATS.map((e,i) => (
                    <Cell key={e.name} fill={e.color}
                      opacity={activeCategory===null||activeCategory===i ? 1 : 0.3}
                      style={{ cursor:'pointer', transition:'opacity 0.2s' }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<DarkTooltip />} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {FRAUD_CATS.map((f,i) => (
              <motion.div key={f.name} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4+i*0.07 }}
                className="flex items-center justify-between cursor-pointer"
                onMouseEnter={() => setActiveCategory(i)} onMouseLeave={() => setActiveCategory(null)}
              >
                <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)] font-medium">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background:f.color }} />
                  {f.name}
                </div>
                <span className="text-xs font-bold text-[color:var(--text-main)]">{f.value}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Row 3: AI Accuracy + Regional ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI Accuracy */}
        <motion.div
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-[color:var(--text-main)]">AI Accuracy This Week</h2>
          </div>
          <p className="text-xs text-slate-600 mb-5">Daily model performance</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_ACC} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#f5550f" />
                    <stop offset="100%" stopColor="#ff8a50" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:12 }} domain={[97,100]} />
                <RechartsTooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="url(#accGrad)" strokeWidth={3}
                  dot={{ fill:'#ff8a50', r:4, strokeWidth:0 }} activeDot={{ r:6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Regional Risk */}
        <motion.div
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-[color:var(--text-main)]">Regional Risk Index</h2>
          </div>
          <p className="text-xs text-slate-600 mb-5">Fraud risk score by city</p>
          <div className="space-y-3">
            {REGIONAL.map((r,i) => {
              const color = r.risk>=80?'#f43f5e':r.risk>=60?'#f59e0b':r.risk>=40?'#f5550f':'#10b981';
              return (
                <motion.div key={r.region} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.55+i*0.06 }}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[color:var(--text-muted)]">{r.region}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">{r.claims} claims</span>
                      <span className="font-black w-8 text-right" style={{ color }}>{r.risk}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width:0 }} animate={{ width:`${r.risk}%` }}
                      transition={{ delay:0.6+i*0.06, duration:0.8, ease:'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background:color, boxShadow:`0 0 8px ${color}80` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Revenue Bar Chart ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`rev-${preset}`}
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          transition={{ delay:0.55, duration:0.5 }}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background:'linear-gradient(90deg,transparent,rgba(16,185,129,0.5),transparent)' }} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[color:var(--text-main)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Revenue Saved — <span className="text-emerald-400">{rangeLabel(preset)}</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">Financial impact of fraud prevention (₹ Lakhs)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[color:var(--text-main)]">₹{data.reduce((s,d)=>s+d.revenue,0).toFixed(1)}L</p>
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-end">
                <ArrowUpRight className="w-3 h-3" /> vs prior period
              </p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top:5, right:10, left:-20, bottom:0 }} barSize={preset==='1M'||preset==='TODAY'? 6 : 28}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} dy={10}
                  interval={preset==='1M'||preset==='TODAY' ? Math.floor(data.length/8) : 0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'#475569', fontSize:11 }} />
                <RechartsTooltip content={<DarkTooltip />} cursor={{ fill:'var(--bg-card)' }} />
                <Bar dataKey="revenue" name="Revenue Saved (₹L)" fill="url(#revGrad)" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
