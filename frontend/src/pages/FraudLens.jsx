import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, UploadCloud, ShieldAlert, Cpu, CheckCircle2, 
  X, AlertTriangle, FileText, Activity, Network
} from 'lucide-react';
import { analyzeFraudLens } from '../utils/api';

export default function FraudLens() {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('auto_insurance');
  const [isHovering, setIsHovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Tabs structure
  const docCategories = [
    { id: 'auto_insurance', label: 'Auto Insurance Claim', icon: Activity },
    { id: 'photo_id', label: 'Photo ID Check', icon: ShieldAlert },
    { id: 'medical_doc', label: 'Medical Document', icon: FileText },
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovering(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
      setResult(null);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    
    try {
      const resp = await analyzeFraudLens(file, docType);
      setResult(resp);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to analyze document");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAnalysis = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-8 pb-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <motion.div initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.5 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <BrainCircuit className="w-3 h-3" />
              Agentic AI
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
            FraudLens <span className="text-transparent bg-clip-text" style={{ backgroundImage:'linear-gradient(90deg, #f5550f, #ff8a50)' }}>Analyzer</span>
          </h1>
          <p className="text-[color:var(--text-muted)] mt-1.5 font-medium max-w-2xl">
            Upload an insurance claim document to run a full multi-agent NVIDIA NIM-powered investigation. 
            The system will scan for inconsistencies, deepfakes, and connected fraud rings in under a minute.
          </p>
        </motion.div>
      </div>

      {!result && !isProcessing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto mt-12 space-y-6"
        >
          {/* Document Type Tabs */}
          <div className="flex items-center justify-center gap-2 bg-white/5 p-1.5 rounded-2xl w-fit mx-auto border border-white/5">
            {docCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = docType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setDocType(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-lg' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 transparent border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={() => setIsHovering(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${
              isHovering ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-[color:var(--bg-card)]'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
              <UploadCloud className={`w-10 h-10 ${isHovering ? 'text-orange-400' : 'text-slate-400'} transition-colors`} />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Upload Claim Document</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Drag and drop your PDF, JSON, or image file here, or click to browse files.</p>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.json" />
            
            {file ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-xl mb-6">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-white">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={startAnalysis}
                  className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
                  style={{ background: 'linear-gradient(135deg, #f5550f, #ff8a50)' }}
                >
                  <Cpu className="w-5 h-5" /> Execute Agentic Investigation
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-white flex items-center gap-2 mx-auto hover:bg-white/10 transition-colors"
              >
                Browse Files
              </button>
            )}
          </div>
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 w-full max-w-2xl mx-auto">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Analysis Failed</p>
                <p>{error}</p>
                <p className="mt-2 text-xs opacity-80">Did you set your NVIDIA_API_KEY in the environment?</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-t-4 border-orange-500 border-opacity-30 rounded-full animate-spin" />
            <div className="absolute inset-2 rounded-full border-r-4 border-orange-400 border-opacity-60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-orange-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Agents analyzing document...</h2>
          <p className="text-slate-400 mb-6">Distributing tasks to NIM-powered models</p>
          
          <div className="w-64 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" /> Document Parsing
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <Network className="w-4 h-4 text-orange-400 animate-pulse" /> Graph Network Discovery
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
               <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" /> Inconsistency Checking
            </div>
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Result Header */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-[color:var(--bg-card)] border border-[color:var(--border-card)] rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex items-center gap-6 z-10">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${result.fraud_score > 70 ? 'bg-red-500/10 border-red-500/30 font-black text-red-500' : (result.fraud_score > 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500')} border shadow-inner text-4xl`}>
                {result.fraud_score}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                  Analysis Complete
                </h2>
                <div className="flex items-center gap-3 text-sm">
                   <span className="font-bold uppercase tracking-widest text-[color:var(--text-muted)]">Risk Level:</span>
                   <span className={`px-2 py-0.5 rounded text-xs font-black uppercase ${result.risk_level === 'high' ? 'bg-red-500/20 text-red-400' : (result.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}`}>
                     {result.risk_level}
                   </span>
                   {result.fraud_ring_detected && (
                     <span className="px-2 py-0.5 rounded text-xs font-black uppercase bg-purple-500/20 text-purple-400 flex items-center gap-1">
                       <Network className="w-3 h-3" /> Ring Detected
                     </span>
                   )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 z-10">
              <button 
                onClick={clearAnalysis}
                className="px-6 py-2.5 rounded-xl font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                Analyze New File
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-[color:var(--bg-card)] border border-[color:var(--border-card)] rounded-3xl p-8">
                 <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500"/> AI Narrative Report</h3>
                 <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                   {result.narrative || "No narrative generated."}
                 </div>
               </div>
               
               {result.scoring_details?.reasoning && (
                 <div className="bg-[color:var(--bg-card)] border border-[color:var(--border-card)] rounded-3xl p-8">
                   <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-500"/> Scoring Breakdown</h3>
                   <div className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap italic bg-black/20 p-4 rounded-xl border border-white/5">
                     {result.scoring_details.reasoning}
                   </div>
                   
                   {result.recommendation && (
                     <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-200 text-sm">
                       <strong>Recommendation:</strong> {result.recommendation}
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="space-y-6">
               <div className="bg-[color:var(--bg-card)] border border-[color:var(--border-card)] rounded-3xl p-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest text-slate-500 border-b border-white/5 pb-3 mb-4">Detected Entities</h3>
                 {result.claim_data && Object.keys(result.claim_data).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(result.claim_data).slice(0, 10).map(([k,v]) => (
                        <div key={k} className="flex justify-between items-start text-xs border-b border-white/5 pb-2">
                           <span className="text-slate-500 capitalize">{String(k).replace(/_/g, ' ')}</span>
                           <span className="text-white font-bold text-right break-words text-[11px] leading-[1.3] max-w-[50%]">
                              {typeof v === 'object' && v !== null ? Object.values(v).join(', ').substring(0, 100) : String(v).substring(0, 100)}
                            </span>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <p className="text-xs text-slate-500">No entities extracted.</p>
                 )}
               </div>

               <div className="bg-[color:var(--bg-card)] border border-[color:var(--border-card)] rounded-3xl p-6">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest text-slate-500 border-b border-white/5 pb-3 mb-4 flex justify-between">
                    Inconsistencies
                    <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px]">{result.inconsistencies?.inconsistencies?.length || 0}</span>
                 </h3>
                 <div className="space-y-3">
                    {result.inconsistencies?.inconsistencies?.length > 0 ? (
                      result.inconsistencies.inconsistencies.map((inc, i) => (
                        <div key={i} className="text-xs bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-slate-300">
                          <strong className="text-red-400 block mb-1">{inc.field || 'General'}:</strong> {inc.description}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> No logic inconsistencies found</div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
