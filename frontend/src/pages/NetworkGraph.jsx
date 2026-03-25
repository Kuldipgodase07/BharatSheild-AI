import React, { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Network, Zap, ShieldAlert, Cpu, Search, RefreshCw, 
  Target, User, ShoppingCart, DollarSign, X, Info, TrendingUp,
  Phone, Home, CreditCard, MapPin, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClaims, getPolicies } from '../utils/api';

const NetworkGraph = () => {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Branding Colors (Matching the requested image palette)
  const FRAUD_THEME = {
    TRANSACTION: '#16a34a', // Green
    ADDRESS_V: '#f472b6',    // Pinkish/Red
    HOME_PHONE_V: '#7c2d12', // Brown
    SSN_V: '#d946ef',       // Magenta/Pink
    BUS_PHONE_V: '#8b5cf6',  // Purple
    HUB_CENTER: '#000000',   // Black Hub
    
    // Links
    LINK_HOME: '#991b1b',    // Dark Red
    LINK_ADDRESS: '#ca8a04', // Orange/Brownish
    LINK_SSN: '#78350f',     // Dark Brown
    LINK_BUS: '#d97706',     // Amber
    
    TEXT_MUTED: '#64748b',
    BG_CARD: 'rgba(13, 9, 7, 0.95)',
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [claims, policies] = await Promise.all([
        getClaims(0, 150),
        getPolicies(0, 40)
      ]);

      const nodes = [];
      const links = [];
      const nodeIds = new Set();

      // Master Fraud Cluster Center (The Black Node)
      const hubId = 'HUB_CENTER_01';
      nodes.push({ 
        id: hubId, 
        type: 'HUB', 
        label: 'Fraud Syndicate Alpha', 
        val: 35, 
        color: FRAUD_THEME.HUB_CENTER,
        icon: 'ShieldAlert'
      });
      nodeIds.add(hubId);

      // Helper to generate random IDs like "#34:563681"
      const genId = (prefix) => `${prefix}${Math.floor(Math.random() * 100)}:${Math.floor(Math.random() * 900000 + 100000)}`;

      // Distribute claim entities (Transactions)
      claims.slice(0, 40).forEach((c, idx) => {
        const nodeId = `TRX_${c.id}`;
        nodes.push({
          id: nodeId,
          type: 'Transaction',
          label: `#${Math.floor(Math.random() * 99)}:${c.id}${Math.floor(Math.random() * 1000)}`,
          val: 18,
          color: FRAUD_THEME.TRANSACTION,
          icon: 'ShoppingCart',
          data: c
        });
        nodeIds.add(nodeId);

        // Core central links
        if (idx < 15) {
          links.push({ 
            source: nodeId, 
            target: hubId, 
            label: 'SSNLink', 
            color: FRAUD_THEME.LINK_SSN 
          });
        }
      });

      // Distribute verification entities
      const verificationTypes = [
        { type: 'addressV', color: FRAUD_THEME.ADDRESS_V, linkLabel: 'AddressLink', lineColor: FRAUD_THEME.LINK_ADDRESS },
        { type: 'homePhoneV', color: FRAUD_THEME.HOME_PHONE_V, linkLabel: 'HomPhoneLink', lineColor: FRAUD_THEME.LINK_HOME },
        { type: 'ssnV', color: FRAUD_THEME.SSN_V, linkLabel: 'SSNLink', lineColor: FRAUD_THEME.LINK_SSN },
        { type: 'busPhoneV', color: FRAUD_THEME.BUS_PHONE_V, linkLabel: 'BusPhoneLink', lineColor: FRAUD_THEME.LINK_BUS }
      ];

      policies.slice(0, 30).forEach((p, idx) => {
        const vType = verificationTypes[idx % verificationTypes.length];
        const nodeId = `${vType.type}_${p.id}`;
        
        nodes.push({
          id: nodeId,
          type: vType.type,
          label: genId('#'),
          val: 20,
          color: vType.color,
          icon: vType.type.includes('Phone') ? 'Phone' : (vType.type.includes('address') ? 'Home' : 'User'),
          data: p
        });
        nodeIds.add(nodeId);

        // Link to hub or a random transaction to create a web
        const targetId = idx % 5 === 0 ? hubId : `TRX_${claims[idx % 10].id}`;
        if (nodeIds.has(targetId)) {
          links.push({
            source: nodeId,
            target: targetId,
            label: vType.linkLabel,
            color: vType.lineColor
          });
        }
      });

      // Add cross-links for the web effect
      for(let i=0; i < 20; i++) {
          const s = nodes[Math.floor(Math.random() * nodes.length)];
          const t = nodes[Math.floor(Math.random() * nodes.length)];
          if (s.id !== t.id && !links.some(l => (l.source === s.id && l.target === t.id))) {
              const vType = verificationTypes[Math.floor(Math.random() * verificationTypes.length)];
              links.push({
                  source: s.id,
                  target: t.id,
                  label: vType.linkLabel,
                  color: vType.lineColor
              });
          }
      }

      setGraphData({ nodes, links });
    } catch (error) {
       console.error(error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="h-full flex flex-col pt-6 gap-6 relative overflow-hidden bg-[color:var(--bg-primary)]">
      
      {/* ── Top Navigation ── */}
      <div className="flex items-center justify-between px-8 z-20">
        <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black text-[color:var(--text-main)] flex items-center gap-3">
             <Network className="w-8 h-8 text-orange-500" />
             BharatShield <span className="text-orange-500">Fraud Web</span>
          </h1>
          <p className="text-[color:var(--text-muted)] mt-1 font-bold uppercase tracking-wider text-[10px]">
             Multi-dimensional Fraud Vector Mapping & Discovery
          </p>
        </motion.div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Lookup ID or Vector..."
                className="pl-12 pr-6 py-2.5 rounded-full bg-[color:var(--bg-card)] border border-[color:var(--border-card)] text-xs font-bold text-white focus:outline-none w-64 uppercase tracking-widest placeholder:text-slate-600"
              />
           </div>
           <button onClick={fetchData} className="p-3 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* ── Main Graph Container ── */}
      <div className="flex-1 flex gap-6 px-8 pb-8 relative min-h-0">
        
        {/* Force Graph Area */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          ref={containerRef} 
          className="flex-1 rounded-[2.5rem] relative overflow-hidden bg-[color:var(--bg-shadow)] border border-[color:var(--border-card)]"
        >
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: `radial-gradient(#f5550f 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

          {!loading && (
            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeRelSize={1}
                d3AlphaDecay={0.03}
                d3VelocityDecay={0.4}
                nodeCanvasObject={(node, ctx, globalScale) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isHovered = hoveredNode?.id === node.id;
                    const r = node.val / 2;

                    // 1. Connection Glow
                    if (isHovered || isSelected) {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r + 6, 0, 2 * Math.PI, false);
                        ctx.fillStyle = `${node.color}22`;
                        ctx.fill();
                        ctx.strokeStyle = node.color;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    // 2. Node Circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color;
                    ctx.fill();
                    
                    // Hub Special Rendering
                    if (node.type === 'HUB') {
                        ctx.strokeStyle = '#f5550f';
                        ctx.lineWidth = 3;
                        ctx.stroke();
                        
                        // Center dot
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
                        ctx.fillStyle = '#fff';
                        ctx.fill();
                    }

                    // 3. Draw subtle icons inside circles if zoomed in
                    if (globalScale > 2) {
                        ctx.fillStyle = '#fff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = `${r * 1.1}px "Outfit"`;
                        
                        let icon = '';
                        switch(node.type) {
                            case 'Transaction': icon = '💰'; break;
                            case 'addressV': icon = '📍'; break;
                            case 'homePhoneV': icon = '📞'; break;
                            case 'ssnV': icon = '🆔'; break;
                            case 'busPhoneV': icon = '🏢'; break;
                            case 'HUB': icon = '🛡️'; break;
                            default: icon = '📄';
                        }
                        ctx.fillText(icon, node.x, node.y);
                    }

                    // 4. Label below node (Matches image format)
                    if (globalScale > 0.8) {
                        ctx.fillStyle = globalScale > 1.5 ? '#fff' : '#94a3b8';
                        ctx.font = `${10 / globalScale}px Outfit`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'top';
                        ctx.fillText(node.label, node.x, node.y + r + 5);
                    }
                }}
                linkCanvasObjectMode={() => 'after'}
                linkCanvasObject={(link, ctx, globalScale) => {
                    const start = link.source;
                    const end = link.target;
                    
                    if (typeof start !== 'object' || typeof end !== 'object') return;

                    // Link label
                    if (globalScale > 1.8) {
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Outfit`;
                        const textPos = {
                            x: start.x + (end.x - start.x) * 0.5,
                            y: start.y + (end.y - start.y) * 0.5
                        };

                        const relAngle = Math.atan2(end.y - start.y, end.x - start.x);
                        
                        ctx.save();
                        ctx.translate(textPos.x, textPos.y);
                        ctx.rotate(relAngle);
                        
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        const textWidth = ctx.measureText(link.label).width;
                        ctx.fillRect(-textWidth/2 - 2, -fontSize/2 - 1, textWidth + 4, fontSize + 2);
                        
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = link.color;
                        ctx.fillText(link.label, 0, 0);
                        ctx.restore();
                    }
                }}
                linkColor={l => l.color}
                linkWidth={l => 1.5}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.2}
                cooldownTicks={100}
                onNodeClick={node => {
                    setSelectedNode(node);
                    graphRef.current.centerAt(node.x, node.y, 800);
                    graphRef.current.zoom(4, 1000);
                }}
                onNodeHover={setHoveredNode}
                backgroundColor="transparent"
            />
          )}

          {/* AI Loader */}
          {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
             </div>
          )}

          {/* Legend HUD (Matching requested image) */}
          <div className="absolute left-8 top-8 flex flex-col gap-2 z-40 pointer-events-none">
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FRAUD_THEME.TRANSACTION }} />
                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Transaction</span>
              </div>
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FRAUD_THEME.ADDRESS_V }} />
                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">addressV</span>
              </div>
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FRAUD_THEME.HOME_PHONE_V }} />
                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">homePhoneV</span>
              </div>
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FRAUD_THEME.SSN_V }} />
                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">ssnV</span>
              </div>
              <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: FRAUD_THEME.BUS_PHONE_V }} />
                 <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">busPhoneV</span>
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-1" style={{ backgroundColor: FRAUD_THEME.LINK_HOME }} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">HomPhoneLink</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-1" style={{ backgroundColor: FRAUD_THEME.LINK_ADDRESS }} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">AddressLink</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-1" style={{ backgroundColor: FRAUD_THEME.LINK_SSN }} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">SSNLink</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-1" style={{ backgroundColor: FRAUD_THEME.LINK_BUS }} />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">BusPhoneLink</span>
                </div>
              </div>
          </div>
        </motion.div>

        {/* ── Side Info Overlay ── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className="w-80 rounded-[2.5rem] bg-[color:var(--bg-card)] border border-[color:var(--border-card)] backdrop-blur-3xl p-6 flex flex-col z-50 shadow-2xl"
            >
              <div className="flex justify-between mb-6">
                 <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Info className="w-5 h-5 text-orange-500" />
                 </div>
                 <button onClick={() => setSelectedNode(null)} className="p-2 text-slate-500 hover:text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1 uppercase">{selectedNode.label}</h2>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{selectedNode.type} Node</span>
              
              <div className="mt-8 space-y-4 flex-1 overflow-y-auto">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-3">Vector Parameters</div>
                    {selectedNode.data && Object.entries(selectedNode.data).slice(0, 8).map(([k,v]) => (
                       <div key={k} className="flex justify-between items-center text-xs mb-2">
                          <span className="text-slate-500 capitalize">{k.replace('_',' ')}</span>
                          <span className="text-white font-bold">{String(v).slice(0,18)}</span>
                       </div>
                    ))}
                 </div>

                 {selectedNode.type === 'HUB' && (
                    <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center gap-2 text-orange-500 mb-2">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">Major Risk Cluster</span>
                        </div>
                        <p className="text-xs text-slate-400">This node represents a central hub in a discovered fraud ring involving multiple stolen identities and shared contact details.</p>
                    </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default NetworkGraph;

