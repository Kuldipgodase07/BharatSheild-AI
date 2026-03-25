import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NOTIFS = [
  { text: 'Critical alert: CLM-1092 flagged', sub: 'Claim Inflation · High Risk', time: 'Just now', color: '#f43f5e' },
  { text: 'Identity mismatch on Policy #A89', sub: 'Identity Theft · Medium Risk', time: '5m ago', color: '#f59e0b' },
  { text: 'AI Engine updated to v2.4.1', sub: 'System · Info', time: '1h ago', color: '#10b981' },
];

export default function DashboardLayout() {
  const [time, setTime] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [isLightMode, setIsLightMode] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);

  const toggleTheme = () => setIsLightMode(!isLightMode);

  // Tick clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Compute fixed-position coordinates from the bell button rect
  const openNotif = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setNotifOpen(v => !v);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => {
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  // Notification Portal — renders outside all stacking contexts
  const notifPortal = createPortal(
    <AnimatePresence>
      {notifOpen && (
        <>
          {/* Full-screen invisible scrim so clicks outside close the dropdown */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setNotifOpen(false)}
          />
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              right: dropdownPos.right,
              width: 320,
              zIndex: 9999,
              background: '#140c09',
              border: '1px solid rgba(245,85,15,0.25)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 80px rgba(245,85,15,0.08)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-card)',
                background: 'rgba(245,85,15,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell style={{ width: 14, height: 14, color: '#ff8a50' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Notifications
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, color: '#f87171',
                background: 'rgba(244,63,94,0.15)',
                border: '1px solid rgba(244,63,94,0.3)',
                padding: '2px 8px',
                borderRadius: 99,
              }}>
                3 new
              </span>
            </div>

            {/* Items */}
            {NOTIFS.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setNotifOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--border-card)' : 'none',
                  background: 'transparent',
                  transition: 'background 0.15s',
                }}
                whileHover={{ background: 'var(--bg-card)' }}
              >
                {/* Color dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                  background: n.color,
                  boxShadow: `0 0 10px ${n.color}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, margin: 0 }}>{n.text}</p>
                  <p style={{ fontSize: 10, color: '#475569', marginTop: 2, fontWeight: 500 }}>{n.sub}</p>
                </div>
                <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, flexShrink: 0 }}>{n.time}</span>
              </motion.div>
            ))}

            {/* Footer */}
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-card)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <button
                onClick={() => setNotifOpen(false)}
                style={{
                  width: '100%', padding: '8px', borderRadius: 10, fontSize: 11,
                  fontWeight: 700, color: '#ff8a50', background: 'rgba(245,85,15,0.1)',
                  border: '1px solid rgba(245,85,15,0.2)', cursor: 'pointer',
                }}
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative flex flex-col">

        {/* Ambient glow layers */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(245,85,15,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(255,138,80,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.04) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        {/* Top Navbar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="hidden lg:flex items-center justify-between px-8 py-3 shrink-0 relative z-10"
          style={{ borderBottom: '1px solid var(--border-card)', background: 'var(--bg-secondary)', backdropFilter: 'blur(16px)' }}
        >
          {/* Live clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[color:var(--text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" style={{ boxShadow: '0 0 6px #10b981' }} />
              {time}
            </div>
            <div className="text-xs text-[color:var(--text-muted)] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
              Tue, 24 Mar 2026
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global search hint */}
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs text-[color:var(--text-muted)] font-medium cursor-pointer hover:text-[color:var(--text-muted)] transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <Search style={{ width: 13, height: 13 }} />
              Quick search…
              <kbd className="text-[10px] font-bold text-[color:var(--text-muted)] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-card)' }}>⌘K</kbd>
            </div>

            {/* Notification bell (ref here, dropdown is a portal) */}
            <button
              ref={bellRef}
              onClick={openNotif}
              className="relative p-2.5 rounded-xl transition-all duration-200"
              style={{
                background: notifOpen ? 'rgba(245,85,15,0.15)' : 'var(--bg-card)',
                border: notifOpen ? '1px solid rgba(245,85,15,0.4)' : '1px solid var(--border-card)',
                color: notifOpen ? '#a5b4fc' : '#64748b',
              }}
            >
              <Bell style={{ width: 16, height: 16 }} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"
                style={{ boxShadow: '0 0 8px #f43f5e', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl transition-all duration-200"
              style={{
                background: isLightMode ? 'rgba(245,85,15,0.1)' : 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                color: isLightMode ? '#f5550f' : '#64748b',
              }}
            >
              {isLightMode ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', boxShadow: 'var(--shadow-card)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-[color:var(--text-main)]" style={{ background: 'linear-gradient(135deg, #f5550f, #ff8a50)' }}>
                AI
              </div>
              <div>
                <p className="text-xs font-bold text-[color:var(--text-main)] leading-none">Admin</p>
                <p className="text-[10px] font-medium mt-0.5"><span className="text-[color:var(--text-muted)]">BharatShield</span><span className="text-transparent bg-clip-text font-bold" style={{ backgroundImage: 'linear-gradient(90deg, #f5550f, #ff8a50)' }}> AI</span></p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portal-rendered notification dropdown */}
        {notifPortal}

        {/* Page content */}
        <div className="py-8 px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto relative z-10 flex-1 w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
