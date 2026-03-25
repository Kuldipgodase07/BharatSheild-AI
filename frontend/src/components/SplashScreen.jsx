import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('init'); // init | scan | done

  useEffect(() => {
    // Ramp progress
    const start = Date.now();
    const duration = 2200;
    const raf = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);
      if (p < 100) requestAnimationFrame(raf);
      else {
        setPhase('done');
        setTimeout(onComplete, 600);
      }
    };
    setTimeout(() => {
      setPhase('scan');
      requestAnimationFrame(raf);
    }, 400);
  }, [onComplete]);

  const steps = [
    { label: 'Initializing AI Engine', threshold: 15 },
    { label: 'Loading Fraud Models', threshold: 40 },
    { label: 'Syncing Policy Database', threshold: 65 },
    { label: 'Calibrating Risk Scores', threshold: 85 },
    { label: 'System Ready', threshold: 100 },
  ];

  const currentStep = steps.filter(s => progress >= s.threshold).pop() || steps[0];

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #080503 0%, #0d0907 50%, #120b08 100%)' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(245,85,15,0.25) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(255,138,80,0.2) 0%, transparent 70%)' }}
        />
      </div>

      {/* Orbiting ring */}
      <div className="relative mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 -m-8 rounded-full"
          style={{
            border: '1px solid rgba(245,85,15,0.2)',
            borderTopColor: 'rgba(245,85,15,0.8)',
            borderRadius: '50%',
            width: 120,
            height: 120,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            border: '1px solid rgba(255,138,80,0.15)',
            borderBottomColor: 'rgba(255,138,80,0.6)',
            borderRadius: '50%',
            width: 150,
            height: 150,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #f5550f 0%, #ff8a50 100%)',
            boxShadow: '0 0 60px rgba(245,85,15,0.6), 0 0 120px rgba(245,85,15,0.2)',
          }}
        >
          <ShieldAlert className="w-10 h-10 text-[color:var(--text-main)]" />

          {/* Scan line */}
          <motion.div
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }}
          />
        </motion.div>
      </div>

      {/* Brand name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
          BharatShield<span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #f5550f, #ff8a50)' }}> AI</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.3em] text-slate-600 uppercase mt-1">AI Fraud Detection Platform</p>
      </motion.div>

      {/* Progress bar + step text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-72"
      >
        <div className="flex items-center justify-between mb-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStep.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-semibold text-[color:var(--text-muted)]"
            >
              {currentStep.label}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs font-black text-orange-500">{progress}%</span>
        </div>

        {/* Bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f5550f, #ff8a50)', boxShadow: '0 0 16px rgba(245,85,15,0.7)' }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                animate={{
                  background: progress >= s.threshold ? '#f5550f' : 'rgba(255,255,255,0.08)',
                  boxShadow: progress >= s.threshold ? '0 0 10px rgba(245,85,15,0.8)' : 'none',
                }}
                transition={{ duration: 0.3 }}
                className="w-2 h-2 rounded-full"
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-[11px] font-mono text-slate-700"
      >
        v2.4.1 · Secured by AI · All Systems Operational
      </motion.div>
    </motion.div>
  );
}
