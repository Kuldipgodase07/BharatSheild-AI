import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle, Menu, X, ShieldAlert, LogOut, Settings, BrainCircuit, BarChart2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SIDEBAR_BG = 'var(--bg-secondary)';

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

  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const { getAlertsPaginated } = await import('../utils/api');
        const data = await getAlertsPaginated(0, 1);
        setAlertCount(data.total || 0);
      } catch (error) {
        console.error('Error fetching alert count:', error);
      }
    };

    fetchAlertCount();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Fraud Alerts', href: '/alerts', icon: AlertTriangle, badge: alertCount > 0 ? String(alertCount) : null },
    { name: 'Claims', href: '/claims', icon: FileText },
    { name: 'Policies', href: '/policies', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Users', href: '/users', icon: User },
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
        style={{ background: SIDEBAR_BG, borderRight: '1px solid var(--border-card)' }}
      >
        {/* Top gradient shimmer */}
        <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(245,85,15,0.12) 0%, transparent 100%)' }} />

        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center gap-3 px-6 relative z-10">
          <motion.div
            whileHover={{ rotate: 20, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #f5550f, #ff8a50)', boxShadow: '0 0 24px rgba(245,85,15,0.5)' }}
          >
            <ShieldAlert className="h-5 w-5 text-[color:var(--text-main)]" />
          </motion.div>
          <div>
            <div className="text-base font-black text-[color:var(--text-main)] tracking-tight leading-none">BharatShield<span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f5550f, #ff8a50)' }}> AI</span></div>
            <div className="text-xs font-bold tracking-widest" style={{ background: 'linear-gradient(90deg, #ff8a50, #ffb27a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI PLATFORM</div>
          </div>
          <button className="ml-auto lg:hidden text-[color:var(--text-muted)] hover:text-[color:var(--text-main)] p-1" onClick={() => setIsOpen(false)}>
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
                      ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-text)', border: 'none', boxShadow: 'var(--shadow-card)' }
                      : { color: 'var(--text-muted)', border: '1px solid transparent' }
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'var(--nav-active-bg)', border: 'transparent' }}
                        transition={{ type: 'spring', bounce: 0.15 }}
                      />
                    )}
                    <span className="flex items-center gap-3 relative z-10">
                      <item.icon className={cn('h-4.5 w-4.5 shrink-0 transition-colors', isActive ? 'text-orange-500' : 'text-slate-600 group-hover:text-[color:var(--text-muted)]')} style={{ width: 18, height: 18 }} />
                      <span className={isActive ? 'text-orange-300' : 'group-hover:text-[color:var(--text-main)] transition-colors'}>{item.name}</span>
                    </span>
                    {item.badge && (
                      <span className="relative z-10 text-[10px] font-black text-[color:var(--text-main)] px-2 py-0.5 rounded-full"
                        style={{ background: isActive ? 'linear-gradient(135deg, #f43f5e, #ff5252)' : 'rgba(255,255,255,0.07)', boxShadow: isActive ? '0 0 12px rgba(244,63,94,0.4)' : 'none' }}>
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
            style={{ background: 'linear-gradient(135deg, rgba(245,85,15,0.12) 0%, rgba(255,138,80,0.08) 100%)', border: '1px solid rgba(245,85,15,0.15)' }}
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl" style={{ background: 'rgba(245,85,15,0.3)' }} />
            <BrainCircuit className="w-5 h-5 text-orange-500 mb-3" />
            <p className="text-xs font-black text-[color:var(--text-main)] mb-0.5">AI Engine {engineStatus.version || 'v2.4'}</p>
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
          <div className="mt-auto pt-4 space-y-1" style={{ borderTop: '1px solid var(--border-card)' }}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-[color:var(--text-muted)] hover:bg-white/5 transition-colors">
              <Settings className="w-4 h-4" style={{ width: 16, height: 16 }} /> Settings
            </button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-700 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-4 h-4" style={{ width: 16, height: 16 }} /> Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-40 flex h-14 lg:hidden items-center justify-between px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-card)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5550f, #ff8a50)' }}>
            <ShieldAlert className="w-4 h-4 text-[color:var(--text-main)]" />
          </div>
          <span className="font-black text-[color:var(--text-main)] text-sm">BharatShield<span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f5550f, #ff8a50)' }}> AI</span></span>
        </div>
        <button className="p-2 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-main)] hover:bg-white/5 transition-colors" onClick={() => setIsOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
