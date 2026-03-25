import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Seeded random ─────────────────────────────────────────────────────────────
function seeded(s) { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); }

// ── Map data → SVG coords ─────────────────────────────────────────────────────
function toSVG(points, w, h, padX = 44, padY = 36) {
  if (!points || !points.length) return [];
  const ys = points.map(p => p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;
  const step = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
  return points.map((p, i) => ({
    sx: padX + i * step,
    sy: h - padY - ((p.y - minY) / rangeY) * (h - padY * 2),
    raw: p,
  }));
}

// ── Smooth bezier path ────────────────────────────────────────────────────────
function buildLine(pts) {
  if (!pts || pts.length < 2) return '';
  let d = `M ${pts[0].sx} ${pts[0].sy}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const mx = (p.sx + c.sx) / 2;
    d += ` C ${mx} ${p.sy}, ${mx} ${c.sy}, ${c.sx} ${c.sy}`;
  }
  return d;
}

function buildArea(pts, h, padY) {
  const line = buildLine(pts);
  if (!line || !pts.length) return '';
  return `${line} L ${pts[pts.length - 1].sx} ${h - padY} L ${pts[0].sx} ${h - padY} Z`;
}

// ── Animated line (path-drawing via stroke-dashoffset JS) ─────────────────────
function AnimLine({ d, stroke, strokeWidth = 2.5, fill = 'none', opacity = 1, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !d) return;
    const len = ref.current.getTotalLength() || 2000;
    ref.current.style.strokeDasharray = len;
    ref.current.style.strokeDashoffset = len;
    ref.current.style.opacity = 0;
    const t = setTimeout(() => {
      ref.current.style.transition = `stroke-dashoffset 1.6s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.3s ease`;
      ref.current.style.strokeDashoffset = 0;
      ref.current.style.opacity = opacity;
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [d, delay, opacity]);

  return <path ref={ref} d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} strokeLinecap="round" strokeLinejoin="round" />;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ visible, x, y, ptA, ptB, colorA, colorB, labelA, labelB, containerRef }) {
  if (!visible || !ptA) return null;
  const W = 165, H = 88;
  let left = x + 14, top = y - H / 2;
  if (containerRef.current) {
    const r = containerRef.current.getBoundingClientRect();
    if (left + W > r.width - 8) left = x - W - 14;
    if (top < 4) top = 4;
    if (top + H > r.height - 4) top = r.height - H - 4;
  }
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tip"
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute', left, top, zIndex: 60,
            background: 'rgba(6,8,26,0.97)',
            border: '1px solid var(--border-card)',
            borderRadius: 14, padding: '11px 14px',
            pointerEvents: 'none',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 20px ${colorA}15`,
            minWidth: W,
          }}
        >
          <p style={{ color: '#475569', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {ptA.raw.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[{ color: colorA, label: labelA, val: ptA.raw.y }, ptB && { color: colorB, label: labelB, val: ptB.raw.y }]
              .filter(Boolean)
              .map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, boxShadow: `0 0 8px ${row.color}`, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, flex: 1 }}>{row.label}</span>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>{row.val}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── GlowingChart ─────────────────────────────────────────────────────────────
export default function GlowingChart({
  dataA, dataB,
  labelA = 'Legitimate', labelB = 'Fraudulent',
  colorA = '#f59e0b', colorB = '#f43f5e',
  height = 280, live = false,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [w, setW] = useState(700);
  const [hovered, setHovered] = useState(null);
  const [clicked, setClicked] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const PAD_X = 44, PAD_Y = 36;

  // Responsive width
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.floor(e.contentRect.width));
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Reset on data change
  useEffect(() => { setHovered(null); setClicked(null); }, [dataA, dataB]);

  const ptsA = useMemo(() => toSVG(dataA, w, height, PAD_X, PAD_Y), [dataA, w, height]);
  const ptsB = useMemo(() => toSVG(dataB, w, height, PAD_X, PAD_Y), [dataB, w, height]);
  const lineA = useMemo(() => buildLine(ptsA), [ptsA]);
  const lineB = useMemo(() => buildLine(ptsB), [ptsB]);
  const areaA = useMemo(() => buildArea(ptsA, height, PAD_Y), [ptsA, height]);
  const areaB = useMemo(() => buildArea(ptsB, height, PAD_Y), [ptsB, height]);

  // Static bokeh — no animation (avoids all framer/CSS attr issues)
  const bokeh = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    cx: Math.round(seeded(i * 7) * Math.max(w - 80, 100)) + 40,
    cy: Math.round(seeded(i * 13) * (height - 60)) + 30,
    r:  Math.round(3 + seeded(i * 3) * 9),
    color: i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : '#8b5cf6',
    className: `bk${i % 4}`,
  })), [colorA, colorB, w, height]);

  const gridYs = [0.2, 0.4, 0.6, 0.8].map(f => height - PAD_Y - f * (height - PAD_Y * 2));

  const activeIdx = hovered !== null ? hovered : clicked;
  const showTip = activeIdx !== null && ptsA[activeIdx] != null;

  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current || !ptsA.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0, bestDist = Infinity;
    ptsA.forEach((pt, i) => {
      const d = Math.abs(pt.sx - mx);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (bestDist < 55) {
      setHovered(best);
      setTipPos({ x: ptsA[best].sx, y: ptsA[best].sy });
    } else setHovered(null);
  }, [ptsA]);

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  const handleClick = useCallback((e) => {
    if (!svgRef.current || !ptsA.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0, bestDist = Infinity;
    ptsA.forEach((pt, i) => {
      const d = Math.abs(pt.sx - mx);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (bestDist < 55) {
      setClicked(prev => prev === best ? null : best);
      setTipPos({ x: ptsA[best].sx, y: ptsA[best].sy });
    } else setClicked(null);
  }, [ptsA]);

  const idA = `glowA-${colorA.replace('#','')}`;
  const idB = `glowB-${colorB.replace('#','')}`;

  return (
    <div ref={containerRef} className="relative select-none" style={{ minHeight: height }}>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: colorA }}>
          <span style={{ width: 18, height: 2, display: 'inline-block', borderRadius: 2, background: colorA, boxShadow: `0 0 6px ${colorA}` }} />
          {labelA}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: colorB }}>
          <span style={{ width: 18, height: 2, display: 'inline-block', borderRadius: 2, background: colorB, boxShadow: `0 0 6px ${colorB}` }} />
          {labelB}
        </div>
        <span className="text-[10px] text-slate-700 ml-auto">Hover or click a point</span>
      </div>

      {/* Tooltip */}
      <Tooltip
        visible={showTip}
        x={tipPos.x} y={tipPos.y}
        ptA={ptsA[activeIdx]} ptB={ptsB[activeIdx]}
        colorA={colorA} colorB={colorB}
        labelA={labelA} labelB={labelB}
        containerRef={containerRef}
      />

      {/* SVG */}
      <svg
        ref={svgRef}
        width="100%" height={height}
        viewBox={`0 0 ${w} ${height}`}
        className="overflow-visible cursor-crosshair"
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <defs>
          <linearGradient id={idA} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={colorA} stopOpacity="0.3" />
            <stop offset="70%"  stopColor={colorA} stopOpacity="0.05" />
            <stop offset="100%" stopColor={colorA} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={idB} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={colorB} stopOpacity="0.22" />
            <stop offset="70%"  stopColor={colorB} stopOpacity="0.04" />
            <stop offset="100%" stopColor={colorB} stopOpacity="0" />
          </linearGradient>
          <filter id="fgA" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="fgB" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="fBk" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4"/>
          </filter>
          <clipPath id="cc">
            <rect x={PAD_X - 4} y={2} width={w - PAD_X * 2 + 8} height={height - 4}/>
          </clipPath>
        </defs>

        {/* Bokeh — CSS class animations */}
        <g opacity="0.4" filter="url(#fBk)" clipPath="url(#cc)">
          {bokeh.map((b, i) => (
            <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.color} className={b.className} />
          ))}
        </g>

        {/* Grid */}
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD_X} y1={y} x2={w - PAD_X} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        <line x1={PAD_X} y1={height - PAD_Y} x2={w - PAD_X} y2={height - PAD_Y}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* Column hover highlight */}
        {showTip && ptsA[activeIdx] && (
          <rect
            x={ptsA[activeIdx].sx - 20} y={PAD_Y / 2}
            width={40} height={height - PAD_Y * 1.5}
            fill="rgba(255,255,255,0.04)" rx={6}
          />
        )}
        {showTip && ptsA[activeIdx] && (
          <line
            x1={ptsA[activeIdx].sx} y1={PAD_Y / 2}
            x2={ptsA[activeIdx].sx} y2={height - PAD_Y}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3"
          />
        )}

        {/* Area fills */}
        <g clipPath="url(#cc)">
          {areaA && <path d={areaA} fill={`url(#${idA})`} stroke="none" opacity={0.9} />}
          {areaB && <path d={areaB} fill={`url(#${idB})`} stroke="none" opacity={0.9} />}
        </g>

        {/* Glow halos (wide blurred lines) */}
        <g clipPath="url(#cc)">
          {lineA && <path d={lineA} stroke={colorA} strokeWidth={8} fill="none" opacity={0.15} strokeLinecap="round" />}
          {lineB && <path d={lineB} stroke={colorB} strokeWidth={8} fill="none" opacity={0.12} strokeLinecap="round" />}
        </g>

        {/* Primary animated lines */}
        <g clipPath="url(#cc)" filter="url(#fgA)">
          {lineA && <AnimLine d={lineA} stroke={colorA} strokeWidth={2.5} delay={0.4} opacity={1} />}
        </g>
        <g clipPath="url(#cc)" filter="url(#fgB)">
          {lineB && <AnimLine d={lineB} stroke={colorB} strokeWidth={2.5} delay={0.55} opacity={1} />}
        </g>

        {/* Data nodes — Series A */}
        {ptsA.map((pt, i) => {
          const isA = activeIdx === i;
          const isC = clicked === i;
          return (
            <g key={`na${i}`}>
              {/* Glow halo */}
              <circle cx={pt.sx} cy={pt.sy} r={isA ? 13 : 9}
                fill={colorA} opacity={isA ? 0.22 : 0.1}
                style={{ filter: `blur(${isA ? 6 : 4}px)`, transition: 'r 0.18s' }}
              />
              {/* Pulsing selection ring */}
              {isC && (
                <circle cx={pt.sx} cy={pt.sy} r={13}
                  fill="none" stroke={colorA} strokeWidth={1.5}
                  className="glowRingPulse"
                  style={{ filter: `drop-shadow(0 0 5px ${colorA})` }}
                />
              )}
              {/* Hollow dot */}
              <circle cx={pt.sx} cy={pt.sy} r={isA ? 5.5 : 4}
                fill="#040416" stroke={colorA} strokeWidth={isA ? 2.5 : 1.8}
                style={{
                  filter: `drop-shadow(0 0 ${isA ? 7 : 4}px ${colorA})`,
                  cursor: 'pointer',
                  transition: 'r 0.15s',
                }}
              />
            </g>
          );
        })}

        {/* Data nodes — Series B */}
        {ptsB.map((pt, i) => {
          const isA = activeIdx === i;
          const isC = clicked === i;
          return (
            <g key={`nb${i}`}>
              <circle cx={pt.sx} cy={pt.sy} r={isA ? 13 : 9}
                fill={colorB} opacity={isA ? 0.22 : 0.1}
                style={{ filter: `blur(${isA ? 6 : 4}px)`, transition: 'r 0.18s' }}
              />
              {isC && (
                <circle cx={pt.sx} cy={pt.sy} r={13}
                  fill="none" stroke={colorB} strokeWidth={1.5}
                  className="glowRingPulse"
                  style={{ filter: `drop-shadow(0 0 5px ${colorB})` }}
                />
              )}
              <circle cx={pt.sx} cy={pt.sy} r={isA ? 5.5 : 4}
                fill="#040416" stroke={colorB} strokeWidth={isA ? 2.5 : 1.8}
                style={{
                  filter: `drop-shadow(0 0 ${isA ? 7 : 4}px ${colorB})`,
                  cursor: 'pointer',
                  transition: 'r 0.15s',
                }}
              />
            </g>
          );
        })}

        {/* Live ring — uses CSS class (not SVG attr animation) */}
        {live && ptsA.length > 0 && (
          <circle
            cx={ptsA[ptsA.length - 1].sx}
            cy={ptsA[ptsA.length - 1].sy}
            r={9}
            fill="none" stroke={colorA} strokeWidth={1.5}
            className="liveRingPulse"
            style={{ filter: `drop-shadow(0 0 8px ${colorA})` }}
          />
        )}

        {/* X labels */}
        {ptsA.map((pt, i) => (
          <text key={i}
            x={pt.sx} y={height - 8}
            textAnchor="middle"
            fill={activeIdx === i ? '#94a3b8' : '#374151'}
            fontSize={10} fontWeight={activeIdx === i ? 700 : 500}
            style={{ transition: 'fill 0.15s' }}
          >
            {pt.raw.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
