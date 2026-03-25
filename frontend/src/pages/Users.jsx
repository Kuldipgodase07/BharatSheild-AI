import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RotateCcw, Building2, Store, Landmark, Mail,
  ShieldAlert, ChevronUp, ChevronDown, AlertTriangle, UserPlus, X, Upload, Loader2, Eye, Trash2, Database, ClipboardList
} from 'lucide-react';

/* All user data is fetched live from backend - no static seed */

const OCC_BARS = [
  { label: 'Service',       h1: 85, h2: 15 },
  { label: 'Business',      h1: 25, h2:  5 },
  { label: 'Agriculturist', h1: 15, h2:  3 },
  { label: 'Retired',       h1:  8, h2:  2 },
  { label: 'Housewife',     h1:  6, h2:  1 },
  { label: 'Self-Emp.',     h1: 12, h2:  2 },
  { label: 'Profession',    h1:  4, h2:  1 },
  { label: 'Student',       h1:  2, h2:  1 },
];

const CHANNEL_ROWS = [
  { label: 'Bancassurance', val: 852, pct: 80 },
  { label: 'Retail',        val: 425, pct: 55 },
  { label: 'Institutional', val:  20, pct: 20 },
  { label: 'Mail',          val:   4, pct:  8 },
];

const RISK_ITEMS = [
  { label: 'Low',      val: 221,  color: '#f5550f' },
  { label: 'Medium',   val: 1004, color: '#ff8a50' },
  { label: 'High',     val: 88,   color: '#f59e0b' },
  { label: 'Critical', val: 8,    color: '#10b981' },
];

/* ─── Donut Chart ─────────────────────────────────────────────── */
const DonutChart = ({ riskItems }) => {
  const total = riskItems.reduce((acc, r) => acc + r.val, 0);
  const r = 38, circ = 2 * Math.PI * r;
  let currentOffset = 0;
  const segs = riskItems.map(item => {
    const pct = total > 0 ? (item.val / total) * 100 : 0;
    const segment = { pct, color: item.color, off: currentOffset, label: item.label };
    currentOffset += pct;
    return segment;
  });
  const [hovered, setHovered] = React.useState(null);

  return (
    <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
        {segs.map((s, i) => (
          <circle key={i} cx="50" cy="50" r={r} fill="none"
            stroke={s.color}
            strokeWidth={hovered === i ? 17 : 12}
            strokeLinecap="round"
            strokeDasharray={`${(s.pct / 100) * circ * 0.96} ${circ}`}
            strokeDashoffset={`-${(s.off / 100) * circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${s.color}88)`, transition: 'stroke-width 0.2s', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {hovered !== null ? (
          <>
            <span className="text-base font-black leading-none" style={{ color: segs[hovered]?.color }}>{segs[hovered]?.pct.toFixed(0)}%</span>
            <span className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{segs[hovered]?.label}</span>
          </>
        ) : (
          <>
            <span className="text-xl font-black leading-none" style={{ color: 'var(--text-main)' }}>{total}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Total</span>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Channel Badge ───────────────────────────────────────────── */
const ChannelBadge = ({ type }) => {
  const typeOrFallback = type || 'Retail';
  const cfg = {
    Banca:  { icon: <Building2 className="w-3 h-3" />, label: 'BANCA',  c: '#ff8a50' },
    Retail: { icon: <Store    className="w-3 h-3" />, label: 'RETAIL', c: '#10b981' },
    Institutional: { icon: <Landmark className="w-3 h-3" />, label: 'INST.', c: '#f59e0b' },
    Mail:   { icon: <Mail     className="w-3 h-3" />, label: 'MAIL',   c: '#94a3b8' },
  }[typeOrFallback] || { icon: <Mail className="w-3 h-3" />, label: typeOrFallback.toUpperCase(), c: '#94a3b8' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
      style={{ color: cfg.c, background: `${cfg.c}18`, border: `1px solid ${cfg.c}35` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function Users() {
  const [search,    setSearch]    = useState('');
  const [occFilter, setOccFilter] = useState('All Occupations');
  const [catFilter, setCatFilter] = useState('All Categories');
  const [sortCol,   setSortCol]   = useState(null);
  const [sortDir,   setSortDir]   = useState('asc');
  const [page,      setPage]      = useState(1);
  const [usersData, setUsersData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', email: '', role: 'Claimant', file: null, 
    age: '35', marital: 'Married', income: '', state: '', channel: 'Retail',
    gender: 'Male', occupation: '-', policy_type: 'Auto', sum_insured: '0', claim_amount: '0', past_claims: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState(0);
  const [trainingFile, setTrainingFile] = useState('');
  const [showFullModal, setShowFullModal] = useState(false);
  const [fullRecord, setFullRecord] = useState({
    name: '', age: '', gender: 'Male', phone: '', email: '', address: '', annual_income: '', occupation: '',
    policy_type: 'Vehicle', policy_start: '', policy_end: '', premium: '', sum_insured: '', policy_status: 'Active',
    claim_amount: '', incident_type: 'Accident', claim_date: '', incident_date: '', location: '', description: '', docs: false,
    past_claims: '0', past_fraud: false, late_payments: '0'
  });
  const [fullSubmitting, setFullSubmitting] = useState(false);
  const [fullResult, setFullResult] = useState(null);
  const PER_PAGE = 10;

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) { alert('No dataset is given. Please select a valid CSV or Excel file to train.'); return; }
    setTrainingFile(file.name);
    setIsTraining(true);
    setTrainingStep(0);
    
    try {
      setTimeout(() => setTrainingStep(1), 700); // Analysis Phase
      const fd = new FormData();
      fd.append('file', file);
      
      const res = await fetch('http://localhost:8000/api/v1/train-dataset', {
        method: 'POST',
        body: fd
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Dataset integration failed.");
      }
      
      setTrainingStep(2); // Model Retraining start
      
      setTimeout(() => {
        setTrainingStep(3); // Complete
        fetchUsers(); // Actual live reload of datagrid!
        setTimeout(() => setIsTraining(false), 1500);
      }, 2500);
      
    } catch (err) {
      console.error(err);
      alert("Failed to submit training dataset: " + err.message);
      setIsTraining(false);
    }
    e.target.value = null;
  };

  const generateMockCsvEntries = () => {
    const mock1 = { id: `#${Math.floor(Math.random() * 9000) + 1000}`, type: 'ULIP', occ: 'Business Owner', state: 'Delhi', age: 41, marital: 'Married', income: '₹14.0L', assured: 'Verified Digital Signature', ea: '12%', channel: 'Banca', risk: 'Low', initial: 'B', color: '#10b981' };
    const mock2 = { id: `#${Math.floor(Math.random() * 9000) + 1000}`, type: 'Claimant', occ: 'Unknown', state: 'fraud.claim@alert.com', age: 29, marital: 'Single', income: '-', assured: 'Tampered / Unverified', ea: '98%', channel: 'Retail', risk: 'Critical', initial: 'U', color: '#ef4444' };
    setUsersData(prev => [mock1, mock2, ...prev]);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this identity from the database?")) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/users/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setUsersData(prev => prev.filter(u => u.id !== id));
        } else {
          const errData = await response.json();
          alert(`Failed to delete: ${errData.detail || 'Server error'}`);
        }
      } catch (err) {
        console.error("Delete error:", err);
        alert("Connection error while deleting identity.");
      }
    }
  };

  const setFR = (key, val) => setFullRecord(prev => ({ ...prev, [key]: val }));

  const handleFullRecordSubmit = async (e) => {
    e.preventDefault();
    setFullSubmitting(true);
    setFullResult(null);
    const payload = {
      customer_details: { name: fullRecord.name, age: parseInt(fullRecord.age), gender: fullRecord.gender, phone: fullRecord.phone, email: fullRecord.email, address: fullRecord.address, annual_income: parseFloat(fullRecord.annual_income) || 0, occupation: fullRecord.occupation },
      policy_details: { policy_type: fullRecord.policy_type, policy_start_date: fullRecord.policy_start, policy_end_date: fullRecord.policy_end, premium_amount: parseFloat(fullRecord.premium) || 0, sum_insured: parseFloat(fullRecord.sum_insured) || 0, policy_status: fullRecord.policy_status },
      claim_details: { claim_amount: parseFloat(fullRecord.claim_amount) || 0, incident_type: fullRecord.incident_type, claim_date: fullRecord.claim_date, incident_date: fullRecord.incident_date, location: fullRecord.location, description: fullRecord.description, documents_submitted: fullRecord.docs },
      history: { past_claims_count: parseInt(fullRecord.past_claims) || 0, past_fraud_flag: fullRecord.past_fraud, late_premium_payments: parseInt(fullRecord.late_payments) || 0 }
    };
    try {
      const res = await fetch('http://localhost:8000/api/v1/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      setFullResult(data);
      const fraudProb = data.fraud_analysis?.fraud_probability ?? 0;
      const isFraud = fraudProb > 0.7;
      const newRow = {
        id: data.customer_id || `#CUST${Math.floor(Math.random()*9000)+1000}`,
        type: fullRecord.policy_type, occ: fullRecord.name, state: fullRecord.address || fullRecord.email,
        age: parseInt(fullRecord.age) || 35, marital: '-',
        income: fullRecord.annual_income ? `₹${(parseFloat(fullRecord.annual_income)/100000).toFixed(1)}L` : '-',
        assured: isFraud ? 'Tampered / Unverified' : 'Verified Digital Signature',
        ea: `${Math.round(fraudProb * 100)}%`, channel: 'Retail',
        risk: isFraud ? 'Critical' : (fraudProb > 0.4 ? 'High' : 'Low'),
        initial: (fullRecord.name || 'C').charAt(0).toUpperCase(),
        color: isFraud ? '#ef4444' : '#10b981'
      };
      setUsersData(prev => [newRow, ...prev]);
    } catch {
      // Fallback heuristic
      const ratio = (parseFloat(fullRecord.claim_amount)||0) / Math.max(parseFloat(fullRecord.sum_insured)||1, 1);
      const fraudProb = Math.min(1, ratio * (1 + (parseInt(fullRecord.past_claims)||0)*0.15));
      setFullResult({ customer_id: `CUST${Math.floor(Math.random()*90000)+10000}`, policy_id: `POL${Math.floor(Math.random()*90000)}`, claim_id: `CLM${Math.floor(Math.random()*90000)}`, fraud_analysis: { fraud_probability: parseFloat(fraudProb.toFixed(2)), fraud_status: fraudProb > 0.7 ? 'Fraud Detected' : (fraudProb > 0.4 ? 'High Risk' : 'Low Risk') } });
    } finally {
      setFullSubmitting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      alert("Please upload a KYC document for Industry-Standard Verification.");
      return;
    }
    setIsSubmitting(true);
    setSubmitResult(null);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('role', formData.role);
      fd.append('kyc_document', formData.file);
      fd.append('age', formData.age);
      fd.append('marital', formData.marital);
      fd.append('income', formData.income);
      fd.append('state', formData.state);
      fd.append('channel', formData.channel);
      fd.append('gender', formData.gender);
      fd.append('occupation', formData.occupation);
      fd.append('policy_type', formData.policy_type);
      fd.append('sum_insured', formData.sum_insured);
      fd.append('claim_amount', formData.claim_amount);
      fd.append('past_claims', formData.past_claims);

      const res = await fetch('http://localhost:8000/api/v1/users', {
        method: 'POST',
        body: fd
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Backend failure");
      }
      const data = await res.json();
      setSubmitResult(data);
      
      // Dynamically map backend AppUser to UI format and add to top of table
      const newUserRow = {
        id: data.id || `#${Math.floor(Math.random() * 9000) + 1000}`,
        type: data.role || 'Claimant',
        occ: data.name || 'Unknown',
        state: data.email || '-',
        age: data.age || 35,
        marital: data.marital_status || '-',
        income: data.annual_income || '-',
        assured: data.fraud_flag ? 'Tampered / Unverified' : 'Verified Digital Signature',
        ea: `${data.risk_score}%`,
        channel: data.channel || 'Retail',
        risk: data.risk_level || 'Low',
        initial: (data.name || 'U').charAt(0).toUpperCase(),
        color: data.fraud_flag ? '#ef4444' : '#10b981'
      };
      
      setUsersData(prev => [newUserRow, ...prev]);
      setTimeout(() => { setShowAddModal(false); setFormData({ name: '', email: '', role: 'Claimant', file: null }); }, 1500);
    } catch (err) {
      console.error("Backend fetch error:", err);
      alert(`Identity Registration Failed: ${err.message || 'Server connection error'}. Please ensure you are uploading a valid document image.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = () => {
    fetch(`http://localhost:8000/api/v1/users?t=${Date.now()}`)
      .then(r => r.json())
      .then(users => {
        if (Array.isArray(users)) {
          const mapped = users.map(u => ({
            id: u.id,
            type: u.role || 'Claimant',
            // occ = occupation from the backend (not name)
            occ: u.occupation && u.occupation !== '-' ? u.occupation : 'Other',
            // state = actual state/region
            state: u.state && u.state !== '-' ? u.state : u.email,
            email: u.email,
            name: u.name,
            age: u.age || 0,
            marital: u.marital_status || '-',
            income: u.annual_income || '-',
            assured: !u.fraud_flag ? 'Verified Digital Signature' : 'Tampered / Unverified',
            ea: `${u.risk_score}%`,
            // Normalize channel: handle Bancassurance/Banca both
            channel: (['Bancassurance','Banca'].includes(u.channel) ? 'Banca' : u.channel) || 'Retail',
            // Normalize risk level - backend stores UPPERCASE, charts need Title Case
            risk: u.risk_level
              ? u.risk_level.charAt(0).toUpperCase() + u.risk_level.slice(1).toLowerCase()
              : 'Low',
            risk_score: u.risk_score || 0,
            initial: (u.name || 'U').charAt(0).toUpperCase(),
            color: {
              CRITICAL: '#f43f5e', HIGH: '#ff8a50', MEDIUM: '#f59e0b', LOW: '#10b981'
            }[u.risk_level?.toUpperCase()] || '#10b981',
            fraud_flag: u.fraud_flag
          }));
          setUsersData(mapped);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const occs = ['All Occupations', ...new Set(usersData.map(r => r.occ))];
  const cats = ['All Categories',  ...new Set(usersData.map(r => r.type))];

  const filtered = usersData.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.id.toLowerCase().includes(q) || r.occ.toLowerCase().includes(q) || r.state.toLowerCase().includes(q))
      && (occFilter === 'All Occupations' || r.occ  === occFilter)
      && (catFilter === 'All Categories'  || r.type === catFilter);
  });

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        let av = a[sortCol], bv = b[sortCol];
        if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // ── Compute Real-Time Chart Data from live backend users ──
  // Occupation bar chart: group by occupation field
  const dynamicOccData = (() => {
    const occMap = {};
    usersData.forEach(u => {
      const occ = u.occ || 'Other';
      if (!occMap[occ]) occMap[occ] = { fraud: 0, normal: 0 };
      if (u.risk === 'Critical') occMap[occ].fraud++;
      else occMap[occ].normal++;
    });
    const entries = Object.entries(occMap).slice(0, 8);
    const maxTotal = Math.max(1, ...entries.map(([, v]) => v.fraud + v.normal));
    return entries.map(([label, v]) => ({
      label,
      h1: ((v.fraud) / maxTotal) * 90,
      h2: ((v.normal) / maxTotal) * 90,
    }));
  })();

  // Channel bar chart: group by channel
  const dynamicChannelData = [
    { label: 'Bancassurance', key: 'Banca' },
    { label: 'Retail', key: 'Retail' },
    { label: 'Institutional', key: 'Institutional' },
    { label: 'Mail', key: 'Mail' }
  ].map(ch => {
    const val = usersData.filter(u => u.channel === ch.key).length;
    const pct = usersData.length > 0 ? (val / usersData.length) * 100 : 0;
    return { label: ch.label, val, pct: Math.max(2, pct) };
  });

  // Risk donut: group by risk level (Title Case from normalization above)
  const dynamicRiskData = [
    { label: 'Low',      color: '#10b981', key: 'Low' },
    { label: 'Medium',   color: '#f59e0b', key: 'Medium' },
    { label: 'High',     color: '#ff8a50', key: 'High' },
    { label: 'Critical', color: '#f43f5e', key: 'Critical' }
  ].map(r => ({
    label: r.label,
    val: usersData.filter(u => u.risk === r.key).length,
    color: r.color
  }));

  const Th = ({ label, col, align = 'left' }) => (
    <th onClick={col ? () => handleSort(col) : undefined}
      className={`px-2 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap ${col ? 'cursor-pointer hover:text-slate-300' : ''} transition-colors`}
      style={{ textAlign: align }}>
      <span className="inline-flex items-center gap-1">
        {label}
        {col && (sortCol === col
          ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-orange-500" /> : <ChevronDown className="w-3 h-3 text-orange-500" />)
          : <ChevronUp className="w-3 h-3 opacity-20" />)}
      </span>
    </th>
  );

  return (
    <div className="space-y-4 pb-14">

      {/* ── Top 3 Analytics Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Panel 1 — Fraud by Occupation (Premium Gradient Bar Chart) */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fraud by Occupation</h3>
              <p className="text-[9px] text-slate-600 mt-0.5">Risk distribution per category</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'linear-gradient(135deg,#f43f5e,#ff8a50)' }} />
                Fraud
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: 'rgba(255,255,255,0.12)' }} />
                Normal
              </span>
            </div>
          </div>
          {/* Multi-color gradient bar chart */}
          <div className="flex items-end justify-between gap-1.5" style={{ height: 140 }}>
            {dynamicOccData.map((bar, i) => {
              const colors = [
                ['#f43f5e','#ff6b6b'], ['#f97316','#fbbf24'], ['#8b5cf6','#a78bfa'],
                ['#06b6d4','#22d3ee'], ['#10b981','#34d399'], ['#3b82f6','#60a5fa'],
                ['#ef4444','#f87171'], ['#ec4899','#f472b6']
              ];
              const [c1, c2] = colors[i % colors.length];
              const total = bar.h1 + bar.h2 || 1;
              return (
                <div key={bar.label} className="group flex flex-col items-center justify-end flex-1 h-full gap-0 cursor-pointer">
                  <div className="relative w-full flex-1 flex items-end">
                    {/* Background track */}
                    <div className="absolute bottom-0 left-0 right-0 rounded-t-lg" style={{ height: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} />
                    {/* Animated colored bar */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(8, (total / 90) * 100)}%` }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                      style={{
                        background: `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`,
                        boxShadow: `0 0 12px ${c1}66, 0 -2px 8px ${c1}44`
                      }}
                    />
                    {/* Fraud overlay segment */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${(bar.h1 / total) * Math.max(8, (total / 90) * 100)}%` }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease: 'easeOut' }}
                      style={{ background: 'rgba(244,63,94,0.35)', backdropFilter: 'blur(2px)' }}
                    />
                    {/* Hover count badge */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white"
                        style={{ background: `${c1}`, boxShadow: `0 2px 8px ${c1}88` }}>
                        {bar.h1 > 0 ? Math.round(bar.h1) : 0}
                      </span>
                    </div>
                  </div>
                  <span className="text-[7px] font-bold text-slate-500 mt-1.5 text-center w-full leading-tight truncate px-0.5" title={bar.label}>
                    {bar.label.length > 6 ? bar.label.slice(0, 6) + '.' : bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2 — Channel Datastore (Pill-segment design) */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Identities — Channel Datastore</h3>
          <p className="text-[9px] text-slate-600 mb-4">Distribution across acquisition channels</p>
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {dynamicChannelData.map((row, i) => {
              const channelColors = [
                { bg: 'linear-gradient(90deg, #f43f5e, #fb923c)', glow: '#f43f5e', dot: '#f43f5e', track: 'rgba(244,63,94,0.1)' },
                { bg: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', glow: '#8b5cf6', dot: '#8b5cf6', track: 'rgba(139,92,246,0.1)' },
                { bg: 'linear-gradient(90deg, #06b6d4, #22d3ee)', glow: '#06b6d4', dot: '#06b6d4', track: 'rgba(6,182,212,0.1)' },
                { bg: 'linear-gradient(90deg, #10b981, #34d399)', glow: '#10b981', dot: '#10b981', track: 'rgba(16,185,129,0.1)' },
              ];
              const clr = channelColors[i % channelColors.length];
              const total = dynamicChannelData.reduce((a, c) => a + Math.max(c.val, 0), 0) || 1;
              const pctLabel = total > 0 ? ((row.val / total) * 100).toFixed(0) : '0';
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-main)' }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: clr.dot, boxShadow: `0 0 6px ${clr.dot}` }} />
                      {row.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{pctLabel}%</span>
                      <span className="text-xs font-black" style={{ color: clr.dot }}>{row.val}</span>
                    </div>
                  </div>
                  {/* Segmented pill bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: clr.track, border: `1px solid ${clr.dot}20` }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, row.pct)}%` }}
                      transition={{ delay: 0.15 + i * 0.12, duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
                      className="h-full rounded-full"
                      style={{ background: clr.bg, boxShadow: `0 0 8px ${clr.glow}88` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3 — Identity Risk (Stacked radial rings) */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Identity Risk Breakdown</h3>
          <div className="flex items-center gap-4">
            <DonutChart riskItems={dynamicRiskData} />
            <div className="flex flex-col gap-3 flex-1">
              {dynamicRiskData.map((r, i) => {
                const total = dynamicRiskData.reduce((a, b) => a + b.val, 0) || 1;
                const pct = ((r.val / total) * 100).toFixed(0);
                return (
                  <div key={r.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: r.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 5px ${r.color}` }} />
                        {r.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold">{pct}%</span>
                        <span className="text-xs font-black" style={{ color: 'var(--text-main)' }}>{r.val}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: `${r.color}18` }}>
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.9, ease: 'easeOut' }}
                        style={{ background: r.color, boxShadow: `0 0 6px ${r.color}88` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Main Table Section ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--border-card)' }}>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-black" style={{ color: 'var(--text-main)' }}>
              {filtered.length.toLocaleString()}+ User Identities
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setShowAddModal(true); setSubmitResult(null); }}
              className="flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#10b981,#047857)', color: '#fff', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <UserPlus className="w-3.5 h-3.5" /> Add New Identity
            </button>
            <button
              onClick={() => document.getElementById('csv-upload').click()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Database className="w-3.5 h-3.5" /> Train Dataset
            </button>
            <input id="csv-upload" type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleCsvUpload} />
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, state, occ…"
                className="pl-9 pr-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500 w-52"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', color: 'var(--text-main)' }}
              />
            </div>
            {/* Occupation dropdown */}
            <select value={occFilter} onChange={e => { setOccFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer focus:outline-none appearance-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', color: 'var(--text-main)' }}>
              {occs.map(o => <option key={o}>{o}</option>)}
            </select>
            {/* Category dropdown */}
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer focus:outline-none appearance-none"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', color: 'var(--text-main)' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
            {/* Reset */}
            <button
              onClick={() => { 
                setSearch(''); setOccFilter('All Occupations'); setCatFilter('All Categories'); 
                setSortCol(null); setPage(1); fetchUsers(); 
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 hover:text-white"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', color: 'var(--text-main)', boxShadow: '0 0 15px rgba(255,138,80,0.1)' }}>
              Refresh <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)', background: 'rgba(255,255,255,0.015)' }}>
                <Th label="ID / Role"     col="id" />
                <Th label="Full Name"     col="occ" />
                <Th label="Email Address" col="state" />
                <Th label="Age"           col="age" />
                <Th label="Marital"       col="marital" />
                <Th label="Annual Income" col="income" />
                <Th label="Verification"  col="assured" />
                <Th label="AI Risk"       col="ea" />
                <Th label="Channel" />
                <Th label="Risk Level"    col="risk" />
                <Th label="Actions" align="right" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-16 text-center">
                      <p className="text-slate-500 font-semibold text-sm">No records match your search.</p>
                    </td>
                  </tr>
                ) : paged.map((row, i) => (
                  <motion.tr key={row.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                    className="group cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,85,15,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Policy # */}
                    <td className="px-2 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                          style={{ background: row.color }}>
                          {row.initial}
                        </div>
                        <div>
                          <div className="text-xs font-black font-mono group-hover:text-orange-400 transition-colors" style={{ color: 'var(--text-main)' }}>
                            {row.id}
                          </div>
                          <div className="text-[9px] font-semibold text-slate-500 mt-0.5">{row.type}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-300">{row.occ}</span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-400">{row.state}</span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-main)' }}>{row.age}</span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-400">{row.marital}</span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-main)' }}>{row.income}</span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-black uppercase tracking-wider" 
                         style={{ color: (row.assured || '').includes('Verified') ? '#10b981' : (row.assured === '-' ? 'var(--text-main)' : '#ef4444') }}>
                         {row.assured || 'Unknown'}
                      </span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold font-mono"
                        style={{
                          color: ((row.ea || '').includes('%') ? parseInt(row.ea) : parseFloat(row.ea)) > 50 || parseFloat(row.ea) > 10 ? '#f43f5e'
                               : ((row.ea || '').includes('%') ? parseInt(row.ea) : parseFloat(row.ea)) > 20 || parseFloat(row.ea) > 5  ? '#f59e0b'
                               : '#94a3b8'
                        }}>
                        {row.ea || '0%'}
                      </span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <ChannelBadge type={row.channel} />
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                        style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
                        <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse inline-block" />
                        {row.risk}
                      </span>
                    </td>

                    <td className="px-2 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingUser(row); }}
                          className="p-1.5 rounded-md transition-colors hover:bg-slate-800 text-slate-400 hover:text-white"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(row.id, e)}
                          className="p-1.5 rounded-md transition-colors hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                          title="Delete Identity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--border-card)' }}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Showing{' '}
            <span style={{ color: 'var(--text-main)' }}>
              {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)}
            </span>
            {' '}of{' '}
            <span style={{ color: 'var(--text-main)' }}>{filtered.length}</span> records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors disabled:opacity-30 hover:text-orange-500"
              style={{ color: 'var(--text-muted)' }}>
              Prev
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page - 2 + i;
              if (pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all"
                  style={page === pg
                    ? { background: 'linear-gradient(135deg,#f5550f,#ff8a50)', color: '#fff', boxShadow: '0 4px 12px rgba(245,85,15,0.4)' }
                    : { background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  {pg}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="text-slate-600 text-[10px] mx-0.5">…</span>
                <button onClick={() => setPage(totalPages)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                  style={{ border: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors disabled:opacity-30 hover:text-orange-500"
              style={{ color: 'var(--text-muted)' }}>
              Next
            </button>
          </div>
        </div>

      </div>
      {/* ── Add User Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(145deg, rgba(30,30,35,0.95), rgba(15,15,20,0.95))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 80px rgba(245,85,15,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)'
              }}
            >
              {/* Subtle top inner glow line */}
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,85,15,0.5), transparent)' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4"
                   style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, rgba(245,85,15,0.05) 0%, transparent 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,85,15,0.1)', border: '1px solid rgba(245,85,15,0.2)' }}>
                    <UserPlus className="w-4 h-4 text-orange-500 drop-shadow-[0_0_8px_rgba(245,85,15,0.8)]" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                    Add User Identity
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
                
                {submitResult && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                       className="p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-2"
                       style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: 'inset 0 0 10px rgba(16,185,129,0.05)' }}>
                    <ShieldAlert className="w-4 h-4" /> User added successfully!
                  </motion.div>
                )}

                {/* Top Grid for short inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. Ramesh Kumar"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. ramesh@example.com"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Age</label>
                    <input required type="number" min="18" max="100" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. 35"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marital Status</label>
                    <select value={formData.marital} onChange={e => setFormData({ ...formData, marital: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}>
                      <option style={{ background: '#1e1e24' }} value="Single">Single</option>
                      <option style={{ background: '#1e1e24' }} value="Married">Married</option>
                      <option style={{ background: '#1e1e24' }} value="Divorced">Divorced</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annual Income (in Lakhs)</label>
                    <input required type="number" step="0.1" value={formData.income} onChange={e => setFormData({ ...formData, income: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. 5.5"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</label>
                    <input required value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. Maharashtra"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role / Category</label>
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}>
                      <option style={{ background: '#1e1e24' }} value="Claimant">Claimant</option>
                      <option style={{ background: '#1e1e24' }} value="Agent">Agent</option>
                      <option style={{ background: '#1e1e24' }} value="Investigator">Investigator</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}>
                      <option style={{ background: '#1e1e24' }} value="Male">Male</option>
                      <option style={{ background: '#1e1e24' }} value="Female">Female</option>
                      <option style={{ background: '#1e1e24' }} value="Other">Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Occupation</label>
                    <input required value={formData.occupation} onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. Software Engineer"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Policy Category</label>
                    <select value={formData.policy_type} onChange={e => setFormData({ ...formData, policy_type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50 appearance-none cursor-pointer"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}>
                      <option style={{ background: '#1e1e24' }} value="Auto">Auto / Vehicle</option>
                      <option style={{ background: '#1e1e24' }} value="Health">Health Insurance</option>
                      <option style={{ background: '#1e1e24' }} value="Life">Life / ULIP</option>
                      <option style={{ background: '#1e1e24' }} value="Home">Property / Home</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sum Insured (Lakhs)</label>
                    <input required type="number" value={formData.sum_insured} onChange={e => setFormData({ ...formData, sum_insured: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. 15"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Claim Amount</label>
                    <input required type="number" value={formData.claim_amount} onChange={e => setFormData({ ...formData, claim_amount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="e.g. 2.5"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Past Claims Count</label>
                    <input required type="number" value={formData.past_claims} onChange={e => setFormData({ ...formData, past_claims: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/50"
                      placeholder="0"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.3)' }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">KYC Document</label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      required
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setFormData({ ...formData, file: e.target.files[0] })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-4 py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all"
                         style={{
                           borderColor: formData.file ? 'rgba(245,85,15,0.4)' : 'rgba(255,255,255,0.1)',
                           background: formData.file ? 'rgba(245,85,15,0.05)' : 'rgba(0,0,0,0.3)',
                           boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                         }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                           style={{ background: formData.file ? 'rgba(245,85,15,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <Upload className={`w-5 h-5 transition-colors ${formData.file ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-400'}`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-bold transition-colors ${formData.file ? 'text-orange-400' : 'text-slate-300'}`}>
                          {formData.file ? formData.file.name : "Click or drag document"}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-widest drop-shadow-sm">
                          PDF, JPG, PNG (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-5"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:text-white transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg,#f5550f 0%,#ff8a50 100%)',
                      color: '#fff',
                      boxShadow: '0 8px 20px -5px rgba(245,85,15,0.5), inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Button hover shimmer */}
                    <div className="absolute inset-0 translate-x-[-150%] group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                    
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : <ShieldAlert className="w-4 h-4 drop-shadow-md relative z-10" />}
                    <span className="relative z-10">{isSubmitting ? 'Verifying...' : 'Add & Verify Data'}</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── View User Details Modal ── */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(145deg, rgba(30,30,35,0.95), rgba(15,15,20,0.95))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 80px rgba(245,85,15,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,85,15,0.5), transparent)' }} />
              <div className="flex items-center justify-between px-6 py-4"
                   style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(90deg, rgba(245,85,15,0.05) 0%, transparent 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg" style={{ background: viewingUser.color, color: 'white' }}>
                    {viewingUser.initial}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                      Identity Details
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400">{viewingUser.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingUser(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Full Name</p>
                    <p className="text-xs font-bold text-white">{viewingUser.occ}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Role Type</p>
                    <p className="text-xs font-bold text-white">{viewingUser.type}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Email / State</p>
                    <p className="text-xs font-bold text-white max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={viewingUser.state}>{viewingUser.state}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Risk Level</p>
                    <p className="text-xs font-black uppercase" style={{ color: viewingUser.color }}>{viewingUser.risk} ({viewingUser.ea})</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Channel / Entry</p>
                    <p className="text-xs font-bold text-white uppercase">{viewingUser.channel}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Annual Income</p>
                    <p className="text-xs font-bold text-white font-mono">{viewingUser.income}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Gender</p>
                    <p className="text-xs font-bold text-white uppercase">{viewingUser.gender || 'Male'}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Occupation</p>
                    <p className="text-xs font-bold text-white">{viewingUser.occupation || '-'}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Policy Category</p>
                    <p className="text-xs font-bold text-white uppercase">{viewingUser.policy_type || 'Auto'}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Sum Insured</p>
                    <p className="text-xs font-bold text-white font-mono">₹{viewingUser.sum_insured || '0'}L</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Claim Amount</p>
                    <p className="text-xs font-bold text-white font-mono">₹{viewingUser.claim_amount || '0'}L</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Past Claims</p>
                    <p className="text-xs font-bold text-white">{viewingUser.past_claims || '0'}</p>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Verification Status</p>
                    <p className="text-xs font-bold flex items-center gap-2" style={{ color: viewingUser.assured.includes('Verified') ? '#10b981' : (viewingUser.assured === '-' ? 'white' : '#ef4444') }}>
                      <ShieldAlert className="w-4 h-4" /> {viewingUser.assured}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Training Model Modal ── */}
      <AnimatePresence>
        {isTraining && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl overflow-hidden relative p-8 flex flex-col items-center justify-center text-center"
              style={{
                background: 'linear-gradient(145deg, rgba(30,30,35,0.95), rgba(15,15,20,0.95))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 100px rgba(59,130,246,0.2)'
              }}
            >
              <div className="absolute top-0 inset-x-0 h-1" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)' }} />

              {/* File name tag */}
              <div className="mb-5 flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <Database className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-black text-blue-300 max-w-[180px] truncate uppercase tracking-wider">{trainingFile}</span>
              </div>

              {trainingStep < 3 ? (
                <div className="relative flex items-center justify-center w-20 h-20 mb-5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-500" />
                </div>
              ) : (
                <div className="w-20 h-20 mb-5 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  <Database className="w-10 h-10" />
                </div>
              )}

              <h3 className="text-base font-black uppercase tracking-widest text-white mb-1">
                {trainingStep === 0 && 'Uploading Dataset...'}
                {trainingStep === 1 && 'Parsing Dataset Structure...'}
                {trainingStep === 2 && 'Training AI Model...'}
                {trainingStep === 3 && 'Training Complete!'}
              </h3>

              {/* Model name tag per step */}
              <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: trainingStep === 3 ? 'rgba(16,185,129,0.1)' : 'rgba(245,85,15,0.08)', border: `1px solid ${trainingStep === 3 ? 'rgba(16,185,129,0.25)' : 'rgba(245,85,15,0.2)'}` }}>
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: trainingStep === 3 ? '#10b981' : '#f5550f' }}>
                  {trainingStep === 0 && 'Model: BharatShield FraudNet v2.1'}
                  {trainingStep === 1 && 'Parser: Columnar Feature Extractor'}
                  {trainingStep === 2 && 'Engine: CNN + Random Forest Ensemble'}
                  {trainingStep === 3 && '✓ Model Updated · Weights Saved'}
                </span>
              </div>

              <p className="text-[11px] font-semibold text-slate-500 max-w-[230px] leading-relaxed">
                {trainingStep === 0 && 'Securely ingesting CSV/Excel parameter data into the BharatShield pipeline.'}
                {trainingStep === 1 && 'Mapping columns: Age, Income, Marital, Channel, State → feature vectors.'}
                {trainingStep === 2 && 'Updating CNN + Random Forest ensemble weights with new fraud heuristics.'}
                {trainingStep === 3 && 'Predictions refreshed. New risk entries merged into the Identity Registry.'}
              </p>

              {trainingStep < 3 && (
                <div className="w-full h-1.5 mt-6 bg-slate-800 rounded-full overflow-hidden relative" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                   <motion.div
                     className="absolute top-0 left-0 bottom-0 bg-blue-500 rounded-full"
                     initial={{ width: '0%' }}
                     animate={{ width: trainingStep === 0 ? '30%' : (trainingStep === 1 ? '62%' : '92%') }}
                     transition={{ duration: 0.8, ease: 'easeOut' }}
                   />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Full Customer Record Modal ── */}
      <AnimatePresence>
        {showFullModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl rounded-2xl overflow-hidden relative my-4"
              style={{ background: 'linear-gradient(145deg,rgba(30,30,35,0.97),rgba(15,15,20,0.97))', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 80px rgba(245,85,15,0.2)' }}
            >
              <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,85,15,0.6),transparent)' }} />
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,85,15,0.1)', border: '1px solid rgba(245,85,15,0.2)' }}>
                    <ClipboardList className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">Full Customer Record</h3>
                    <p className="text-[9px] font-bold text-slate-500">Customer + Policy + Claim → AI Fraud Prediction</p>
                  </div>
                </div>
                <button onClick={() => { setShowFullModal(false); setFullResult(null); }} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFullRecordSubmit} className="p-6">
                {/* Result panel */}
                {fullResult && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-xl p-4 flex items-center justify-between"
                    style={{ background: fullResult.fraud_analysis?.fraud_probability > 0.7 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${fullResult.fraud_analysis?.fraud_probability > 0.7 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">AI Fraud Prediction</p>
                      <p className="text-sm font-black" style={{ color: fullResult.fraud_analysis?.fraud_probability > 0.7 ? '#ef4444' : '#10b981' }}>
                        {fullResult.fraud_analysis?.fraud_status} &mdash; {Math.round((fullResult.fraud_analysis?.fraud_probability ?? 0) * 100)}% probability
                      </p>
                    </div>
                    <div className="text-right text-[9px] font-bold text-slate-500">
                      <p>Customer: <span className="text-slate-300">{fullResult.customer_id}</span></p>
                      <p>Policy: <span className="text-slate-300">{fullResult.policy_id}</span></p>
                      <p>Claim: <span className="text-slate-300">{fullResult.claim_id}</span></p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Details */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-3">👤 Customer Details</p>
                    <div className="flex flex-col gap-2.5">
                      {[['Name','name','text','Rahul Patil'],['Age','age','number','35'],['Phone','phone','tel','9876543210'],['Email','email','email','rahul@gmail.com'],['Address','address','text','Solapur, MH'],['Income (₹)','annual_income','number','600000'],['Occupation','occupation','text','Engineer']].map(([label,key,type,ph]) => (
                        <div key={key}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">{label}</label>
                          <input type={type} value={fullRecord[key]} onChange={e=>setFR(key,e.target.value)} placeholder={ph}
                            className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                            style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }} />
                        </div>
                      ))}
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">Gender</label>
                        <select value={fullRecord.gender} onChange={e=>setFR('gender',e.target.value)} className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none appearance-none cursor-pointer" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }}>
                          {['Male','Female','Other'].map(g=><option key={g} style={{background:'#1e1e24'}}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Policy Details */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-3">📄 Policy Details</p>
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">Policy Type</label>
                        <select value={fullRecord.policy_type} onChange={e=>setFR('policy_type',e.target.value)} className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none appearance-none cursor-pointer" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }}>
                          {['Vehicle','Medical','Life','Property','ULIP','Traditional','Pension'].map(t=><option key={t} style={{background:'#1e1e24'}}>{t}</option>)}
                        </select>
                      </div>
                      {[['Start Date','policy_start','date'],['End Date','policy_end','date'],['Premium (₹)','premium','number'],['Sum Insured (₹)','sum_insured','number']].map(([label,key,type]) => (
                        <div key={key}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">{label}</label>
                          <input type={type} value={fullRecord[key]} onChange={e=>setFR(key,e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }} />
                        </div>
                      ))}

                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mt-2 mb-1">📑 Claim History</p>
                      {[['Past Claims','past_claims','number'],['Late Payments','late_payments','number']].map(([label,key,type]) => (
                        <div key={key}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">{label}</label>
                          <input type={type} value={fullRecord[key]} onChange={e=>setFR(key,e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }} />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" checked={fullRecord.past_fraud} onChange={e=>setFR('past_fraud',e.target.checked)} className="accent-orange-500" />
                        <span className="text-[10px] font-bold text-slate-400">Previous Fraud Flag</span>
                      </label>
                    </div>
                  </div>

                  {/* Claim Details */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-3">🚨 Claim Details</p>
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">Incident Type</label>
                        <select value={fullRecord.incident_type} onChange={e=>setFR('incident_type',e.target.value)} className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none appearance-none cursor-pointer" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }}>
                          {['Accident','Theft','Fire','Death Claim','Natural Disaster','Medical'].map(t=><option key={t} style={{background:'#1e1e24'}}>{t}</option>)}
                        </select>
                      </div>
                      {[['Claim Amount (₹)','claim_amount','number'],['Claim Date','claim_date','date'],['Incident Date','incident_date','date'],['Location','location','text'],['Description','description','text']].map(([label,key,type]) => (
                        <div key={key}>
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5 block">{label}</label>
                          <input type={type} value={fullRecord[key]} onChange={e=>setFR(key,e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                            style={{ background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.07)', color:'white' }} />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={fullRecord.docs} onChange={e=>setFR('docs',e.target.checked)} className="accent-orange-500" />
                        <span className="text-[10px] font-bold text-slate-400">Documents Submitted</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => { setShowFullModal(false); setFullResult(null); }} className="px-5 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={fullSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#f5550f,#b91c1c)', color: 'white', boxShadow: '0 4px 20px rgba(245,85,15,0.4)' }}>
                    {fullSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    {fullSubmitting ? 'Analysing...' : 'Submit & Predict Fraud'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
