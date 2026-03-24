import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle, Menu, X, ShieldAlert, LogOut, Settings, BrainCircuit, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SIDEBAR_BG = 'rgba(6, 8, 22, 0.98)';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [engineStatus, setEngineStatus] = useState({
    version: 'v2.4',
    accuracy: 99.4,
    status: 'All Systems Operational'
  });
  const [engineConnected, setEngineConnected] = useState(false);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_AI_WS_URL || 'ws://localhost:8000/ws/ai-engine';
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setEngineConnected(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEngineStatus((prev) => ({ ...prev, ...data }));
        } catch {
          // Ignore malformed messages
        }
      };
      ws.onclose = () => {
        setEngineConnected(false);
        reconnectTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        setEngineConnected(false);
        ws.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Fraud Alerts', href: '/alerts', icon: AlertTriangle, badge: '12' },
    { name: 'Claims', href: '/claims', icon: FileText },
    { name: 'Policies', href: '/policies', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col lg:static lg:translate-x-0 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Top gradient shimmer */}
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, transparent 100%)' }} />

        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center gap-3 px-6 relative z-10">
          <motion.div
            whileHover={{ rotate: 20, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 24px rgba(99,102,241,0.5)' }}
          >
            <ShieldAlert className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <div className="text-base font-black text-white tracking-tight leading-none">TruGuard</div>
            <div className="text-xs font-bold tracking-widest" style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI PLATFORM</div>
          </div>
          <button className="ml-auto lg:hidden text-slate-500 hover:text-white p-1" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col px-4 mt-2 overflow-y-auto relative z-10 pb-4">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 mb-3 px-2">Navigation</div>
          <ul className="flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                    className="group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
                    style={isActive
                      ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }
                      : { color: '#475569', border: '1px solid transparent' }
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
                        transition={{ type: 'spring', bounce: 0.15 }}
                      />
                    )}
                    <span className="flex items-center gap-3 relative z-10">
                      <item.icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400')} style={{ width: 18, height: 18 }} />
                      <span className={isActive ? 'text-indigo-300' : 'group-hover:text-slate-300 transition-colors'}>{item.name}</span>
                    </span>
                    {item.badge && (
                      <span className="relative z-10 text-[10px] font-black text-white px-2 py-0.5 rounded-full"
                        style={{ background: isActive ? 'linear-gradient(135deg, #f43f5e, #ec4899)' : 'rgba(255,255,255,0.07)', boxShadow: isActive ? '0 0 12px rgba(244,63,94,0.4)' : 'none' }}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* AI Engine Status Widget */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="mt-8 rounded-2xl p-5 relative overflow-hidden cursor-pointer"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.08) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.3)' }} />
            <BrainCircuit className="w-5 h-5 text-indigo-400 mb-3" />
            <p className="text-xs font-black text-white mb-0.5">AI Engine {engineStatus.version || 'v2.4'}</p>
            <p className="text-[10px] text-slate-600 leading-relaxed mb-3">
              Neural fraud patterns updated. Accuracy: {engineStatus.accuracy != null ? `${engineStatus.accuracy}%` : 'N/A'}
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" style={{ boxShadow: '0 0 8px #10b981' }} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400">
                {engineConnected ? (engineStatus.status || 'All Systems Operational') : 'Connecting...'}
              </span>
            </div>
          </motion.div>

          {/* Bottom actions */}
          <div className="mt-auto pt-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-colors">
              <Settings className="w-4 h-4" style={{ width: 16, height: 16 }} /> Settings
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-700 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-4 h-4" style={{ width: 16, height: 16 }} /> Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-40 flex h-14 lg:hidden items-center justify-between px-4" style={{ background: 'rgba(6,8,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm">TruGuard AI</span>
        </div>
        <button className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setIsOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
