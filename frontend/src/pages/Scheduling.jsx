import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { runScheduling } from '../api.js'
import GanttChart from '../components/GanttChart.jsx'
import NumInput from '../components/NumInput.jsx'

const PROC_COLORS = [
  '#00d9f5','#b06ef3','#00e878','#ff7a29',
  '#f43f5e','#eab308','#3b82f6','#ec4899',
  '#14b8a6','#8b5cf6',
]

const DEFAULT_PROCS = [
  { id: 0, label: 'P0', arrival: 0, burst: 5, priority: 2 },
  { id: 1, label: 'P1', arrival: 2, burst: 3, priority: 1 },
  { id: 2, label: 'P2', arrival: 4, burst: 4, priority: 3 },
]

function CountUp({ value }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  React.useEffect(() => {
    const ctrl = animate(prev.current, value, {
      duration: 0.9, ease: 'easeOut',
      onUpdate: v => setDisplay(parseFloat(v.toFixed(2))),
    })
    prev.current = value
    return ctrl.stop
  }, [value])
  return <span>{display.toFixed(2)}</span>
}

export default function Scheduling() {
  const [algo, setAlgo]     = useState('fcfs')
  const [quantum, setQ]     = useState(2)
  const [procs, setProcs]   = useState(DEFAULT_PROCS)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  const addProc = () => {
    const id = procs.length
    setProcs([...procs, { id, label: `P${id}`, arrival: 0, burst: 4, priority: 1 }])
  }
  const removeProc = i => setProcs(procs.filter((_, idx) => idx !== i))
  const updProc = (i, field, val) =>
    setProcs(procs.map((p, idx) => idx === i ? { ...p, [field]: field === 'label' ? val : val } : p))

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const data = await runScheduling({ algorithm: algo, quantum, processes: procs })
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const totalTime = result ? Math.max(...result.gantt.map(g => g.end)) : 0

  return (
    <div className="module-page" style={{ background: 'var(--bg)' }}>

      {/* Ambient */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '50vw', height: '60vh',
        background: 'radial-gradient(ellipse, rgba(0,217,245,0.06) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(14,14,24,0.85)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0, zIndex: 2, position: 'relative',
      }}>
        <Link to="/" className="back-btn">← Back</Link>
        <div style={{ width: 1, height: 22, background: 'var(--border2)' }}/>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--cyan)', letterSpacing: '-0.3px' }}>CPU Scheduling</h1>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>FCFS · Priority · Round Robin</p>
        </div>
      </div>

      {/* Body */}
      <div className="module-body" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px', display: 'flex', gap: 22, alignItems: 'flex-start' }}>

          {/* ── Left panel ── */}
          <div style={{ width: 310, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Algorithm selector */}
            <div className="card">
              <div className="section-label">Algorithm</div>
              <div className="pill-group">
                {[['fcfs','FCFS'],['priority','Priority'],['rr','Round Robin']].map(([k,l]) => (
                  <button key={k} className={`pill ${algo===k?'active-cyan':''}`}
                    onClick={() => setAlgo(k)}>{l}</button>
                ))}
              </div>

              <AnimatePresence>
                {algo === 'rr' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted2)' }}>Time Quantum</span>
                      <NumInput value={quantum} onChange={setQ} min={1} max={20} color="var(--cyan)" width={110}/>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Processes */}
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Processes</div>
                <button onClick={addProc} style={{
                  padding: '4px 13px', borderRadius: 7,
                  background: 'var(--cyan-dim)', border: '1px solid rgba(0,217,245,0.25)',
                  color: 'var(--cyan)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>+ Add</button>
              </div>

              <AnimatePresence>
                {procs.map((p, i) => {
                  const color = PROC_COLORS[i % PROC_COLORS.length]
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -16, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden', marginBottom: 8 }}
                    >
                      <div style={{
                        background: 'var(--surface2)',
                        border: `1px solid ${color}18`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                      }}>
                        {/* Label row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: color, boxShadow: `0 0 8px ${color}`,
                            flexShrink: 0,
                          }}/>
                          <input
                            type="text"
                            value={p.label}
                            onChange={e => updProc(i, 'label', e.target.value)}
                            style={{
                              flex: 1, background: 'transparent', border: 'none',
                              borderBottom: `1px solid ${color}30`, borderRadius: 0,
                              padding: '2px 4px', fontWeight: 800, fontSize: 13,
                              color, fontFamily: "'JetBrains Mono', monospace",
                              outline: 'none',
                            }}
                          />
                          <button onClick={() => removeProc(i)} style={{
                            width: 22, height: 22, borderRadius: 5,
                            background: 'transparent', border: '1px solid var(--border)',
                            color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>×</button>
                        </div>

                        {/* Values row */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                          <NumInput
                            value={p.arrival} onChange={v => updProc(i,'arrival',v)}
                            min={0} max={99} color={color} label="Arrival" width={80}
                          />
                          <NumInput
                            value={p.burst} onChange={v => updProc(i,'burst',v)}
                            min={1} max={50} color={color} label="Burst" width={80}
                          />
                          {algo === 'priority' && (
                            <NumInput
                              value={p.priority} onChange={v => updProc(i,'priority',v)}
                              min={1} max={10} color={color} label="Priority" width={80}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Run */}
            <button className="run-btn" onClick={run} disabled={loading || procs.length === 0}
              style={{
                background: loading
                  ? 'var(--surface2)'
                  : 'linear-gradient(135deg, #00d9f5, #0891b2)',
                color: loading ? 'var(--muted2)' : '#000',
                boxShadow: loading ? 'none' : '0 0 32px rgba(0,217,245,0.3)',
              }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>⟳</motion.span>
                  Running...
                </span>
              ) : '▶ Run Simulation'}
            </button>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(255,77,106,0.3)', borderRadius: 10, fontSize: 13, color: 'var(--red)' }}>
                {error}
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      { label: 'Avg Wait Time', value: result.avg_wait, unit: 'ms' },
                      { label: 'Avg Turnaround', value: result.avg_tat, unit: 'ms' },
                    ].map((stat, i) => (
                      <motion.div key={stat.label}
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 280, delay: i * 0.05 }}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid rgba(0,217,245,0.18)',
                          borderRadius: 16, padding: '20px 22px',
                          boxShadow: '0 0 24px rgba(0,217,245,0.07)',
                        }}
                      >
                        <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 10 }}>{stat.label}</div>
                        <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                          <CountUp value={stat.value}/>
                          <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)', marginLeft: 5 }}>{stat.unit}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Gantt */}
                  <div className="card" style={{ border: '1px solid rgba(0,217,245,0.12)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 18 }}>Gantt Chart</div>
                    <GanttChart gantt={result.gantt} totalTime={totalTime}/>
                  </div>

                  {/* Metrics table */}
                  <div className="card">
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>Process Metrics</div>
                    <table>
                      <thead>
                        <tr>
                          <th>Process</th><th>Arrival</th><th>Burst</th>
                          <th>Completion</th><th>Wait</th><th>Turnaround</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.processes.map((p, i) => (
                          <motion.tr key={p.label}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  width: 7, height: 7, borderRadius: '50%',
                                  background: PROC_COLORS[i % PROC_COLORS.length],
                                  boxShadow: `0 0 6px ${PROC_COLORS[i % PROC_COLORS.length]}`,
                                  flexShrink: 0,
                                }}/>
                                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{p.label}</span>
                              </span>
                            </td>
                            <td className="mono">{p.arrival}</td>
                            <td className="mono">{p.burst}</td>
                            <td className="mono" style={{ color: 'var(--cyan)', fontWeight: 600 }}>{p.completion}</td>
                            <td className="mono" style={{ color: p.waiting > 8 ? 'var(--orange)' : 'var(--muted2)' }}>{p.waiting}</td>
                            <td className="mono">{p.turnaround}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : !loading ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, minHeight: 300 }}>
                  <motion.div
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ fontSize: 72, filter: 'grayscale(1)' }}
                  >◈</motion.div>
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Configure processes and run a simulation</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
