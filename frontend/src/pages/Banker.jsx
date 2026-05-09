import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { runBanker } from '../api.js'
import BankerMatrix from '../components/BankerMatrix.jsx'
import NumInput from '../components/NumInput.jsx'

function MatrixInput({ rows, cols, values, onChange, color, rowLabels }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${color}22`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `72px repeat(${cols}, 1fr)`,
        background: `${color}0a`,
        borderBottom: `1px solid ${color}18`,
      }}>
        <div style={{ padding: '6px 10px', fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Proc</div>
        {Array.from({ length: cols }, (_, j) => (
          <div key={j} style={{
            padding: '6px 0', textAlign: 'center',
            fontSize: 11, color, fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
          }}>R{j}</div>
        ))}
      </div>

      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: `72px repeat(${cols}, 1fr)`,
          borderBottom: i < rows - 1 ? `1px solid ${color}0e` : 'none',
          alignItems: 'center',
        }}>
          <div style={{
            padding: '6px 10px', fontSize: 12, fontWeight: 700,
            color, fontFamily: "'JetBrains Mono', monospace",
            background: `${color}08`,
          }}>
            {rowLabels?.[i] || `P${i}`}
          </div>
          {Array.from({ length: cols }, (_, j) => (
            <input
              key={j}
              type="number" min="0"
              value={values[i]?.[j] ?? 0}
              onChange={e => onChange(i, j, parseInt(e.target.value) || 0)}
              style={{
                width: '100%', textAlign: 'center',
                background: 'transparent',
                border: 'none',
                borderLeft: `1px solid ${color}10`,
                borderRadius: 0,
                padding: '9px 4px',
                fontSize: 14, fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text)',
                outline: 'none',
                transition: 'background 0.15s',
              }}
              onFocus={e => { e.target.style.background = `${color}12` }}
              onBlur={e => { e.target.style.background = 'transparent' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SafeSequenceViz({ seq, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {seq.map((proc, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 320, damping: 22 }}
            style={{
              padding: '7px 18px',
              borderRadius: 10,
              background: `${color}12`,
              border: `1px solid ${color}50`,
              color,
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 15,
              boxShadow: `0 0 20px ${color}25`,
              position: 'relative',
            }}
          >
            {/* Step number */}
            <span style={{
              position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, fontWeight: 700, color: color + 'aa',
              background: 'var(--surface)',
              padding: '1px 5px', borderRadius: 999,
              border: `1px solid ${color}25`,
            }}>{i + 1}</span>
            {proc}
          </motion.div>
          {i < seq.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.12 + 0.08 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                style={{ color: color + '80', fontSize: 16 }}
              >→</motion.div>
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function StepTrace({ steps, color }) {
  const [open, setOpen] = useState(false)
  if (!steps || steps.length === 0) return null
  return (
    <div className="card" style={{ border: `1px solid ${color}18` }}>
      <button onClick={() => setOpen(s => !s)} style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: color, boxShadow: `0 0 8px ${color}`,
          }}/>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color }}>
            Safety Algorithm Steps
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 999,
            background: `${color}15`, border: `1px solid ${color}30`, color,
          }}>{steps.length}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ marginLeft: 'auto', color, fontSize: 14 }}
        >▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {steps.map((st, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 13px',
                    background: 'var(--surface2)',
                    border: `1px solid ${color}10`,
                    borderRadius: 10,
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: `${color}15`, border: `1px solid ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color, width: 36, flexShrink: 0, fontSize: 13 }}>{st.process}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 11 }}>[{st.work_before.join(', ')}]</span>
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                      style={{ color }}
                    >→</motion.span>
                    <span style={{ fontFamily: 'monospace', color: '#00e878', fontSize: 11, fontWeight: 700 }}>[{st.work_after.join(', ')}]</span>
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 9, color: '#00e87880',
                    fontFamily: 'monospace', background: 'rgba(0,232,120,0.08)',
                    border: '1px solid rgba(0,232,120,0.15)',
                    padding: '2px 7px', borderRadius: 5,
                  }}>+{st.work_after.map((v,j) => v - st.work_before[j]).join(',')} released</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Banker() {
  const [n, setN]       = useState(3)
  const [m, setM]       = useState(3)
  const [names, setNames] = useState(['P0','P1','P2','P3','P4','P5','P6','P7'])
  const [avail, setAvail] = useState([3,3,2,0,0])
  const [alloc, setAlloc] = useState(Array.from({length:8},()=>Array(5).fill(0)))
  const [maxN,  setMaxN]  = useState(Array.from({length:8},()=>Array(5).fill(0)))
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const COLOR = 'var(--purple)'
  const HEX   = '#b06ef3'

  const loadExample = () => {
    setN(5); setM(3)
    setAvail([3,3,2,0,0])
    const a = Array.from({length:8},()=>Array(5).fill(0))
    a[0]=[0,1,0,0,0]; a[1]=[2,0,0,0,0]; a[2]=[3,0,2,0,0]
    a[3]=[2,1,1,0,0]; a[4]=[0,0,2,0,0]
    setAlloc(a)
    const mx = Array.from({length:8},()=>Array(5).fill(0))
    mx[0]=[7,5,3,0,0]; mx[1]=[3,2,2,0,0]; mx[2]=[9,0,2,0,0]
    mx[3]=[2,2,2,0,0]; mx[4]=[4,3,3,0,0]
    setMaxN(mx)
  }

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const data = await runBanker({
        n, m,
        available: avail.slice(0, m),
        allocation: alloc.slice(0, n).map(r => r.slice(0, m)),
        max: maxN.slice(0, n).map(r => r.slice(0, m)),
        names: names.slice(0, n),
      })
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="module-page" style={{ background: 'var(--bg)' }}>
      {/* Purple ambient */}
      <div style={{
        position: 'absolute', top: '-15%', left: '-10%', width: '60vw', height: '60vh',
        background: `radial-gradient(ellipse, ${HEX}09 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(14,14,24,0.85)', backdropFilter: 'blur(12px)',
        flexShrink: 0, zIndex: 2, position: 'relative',
      }}>
        <Link to="/" className="back-btn">← Back</Link>
        <div style={{ width:1, height:22, background:'var(--border2)' }}/>
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" style={{ color: HEX }}>
          <polygon points="16,3 29,10 29,22 16,29 3,22 3,10" stroke="currentColor" strokeWidth="1.8" fill="none"/>
          <circle cx="16" cy="16" r="3" fill="currentColor"/>
        </svg>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: COLOR, letterSpacing: '-0.3px' }}>Banker's Algorithm</h1>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Deadlock Avoidance · Safety Check</p>
        </div>
        <button onClick={loadExample} style={{
          marginLeft: 'auto',
          padding: '6px 16px', borderRadius: 8,
          background: `${HEX}12`, border: `1px solid ${HEX}30`,
          color: COLOR, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = `${HEX}22` }}
          onMouseLeave={e => { e.currentTarget.style.background = `${HEX}12` }}
        >Load Textbook Example</button>
      </div>

      {/* Body — this is the scrollable area */}
      <div className="module-body" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '24px', display: 'flex', gap: 22, alignItems: 'flex-start' }}>

          {/* ── Left config panel ── */}
          <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* n / m config */}
            <div className="card" style={{ border: `1px solid ${HEX}18` }}>
              <div className="section-label">System Configuration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Processes (n)</span>
                  <NumInput value={n} onChange={setN} min={1} max={8} color={COLOR} width={120}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Resources (m)</span>
                  <NumInput value={m} onChange={setM} min={1} max={5} color={COLOR} width={120}/>
                </div>
              </div>
            </div>

            {/* Process names */}
            <div className="card" style={{ border: `1px solid ${HEX}18` }}>
              <div className="section-label">Process Names</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({length:n},(_,i)=>(
                  <input key={i} type="text" value={names[i]||`P${i}`}
                    onChange={e => setNames(ns=>{const a=[...ns];a[i]=e.target.value;return a})}
                    style={{
                      width: 58, textAlign: 'center', fontWeight: 800,
                      color: HEX, fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: `${HEX}0d`,
                      border: `1px solid ${HEX}30`, borderRadius: 8,
                      padding: '6px 4px', outline: 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Available */}
            <div className="card" style={{ border: `1px solid ${HEX}18` }}>
              <div className="section-label">Available Resources</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Array.from({length:m},(_,j)=>(
                  <div key={j} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      fontSize: 11, color: HEX, fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>R{j}</div>
                    <NumInput
                      value={avail[j]??0}
                      onChange={v => setAvail(a=>{const n=[...a];n[j]=v;return n})}
                      min={0} max={99} color={COLOR} width={76}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Allocation */}
            <div className="card" style={{ border: `1px solid ${HEX}18` }}>
              <div className="section-label">Allocation Matrix</div>
              <MatrixInput rows={n} cols={m} values={alloc}
                color={HEX} rowLabels={names.slice(0,n)}
                onChange={(i,j,v)=>setAlloc(a=>{const nn=a.map(r=>[...r]);nn[i][j]=v;return nn})}
              />
            </div>

            {/* Max */}
            <div className="card" style={{ border: `1px solid ${HEX}18` }}>
              <div className="section-label">Maximum Need Matrix</div>
              <MatrixInput rows={n} cols={m} values={maxN}
                color={HEX} rowLabels={names.slice(0,n)}
                onChange={(i,j,v)=>setMaxN(a=>{const nn=a.map(r=>[...r]);nn[i][j]=v;return nn})}
              />
            </div>

            {/* Run */}
            <button className="run-btn" onClick={run} disabled={loading}
              style={{
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #b06ef3, #7c3aed)',
                color: loading ? 'var(--muted2)' : '#fff',
                boxShadow: loading ? 'none' : `0 0 32px ${HEX}44`,
              }}>
              {loading ? (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <motion.span animate={{rotate:360}} transition={{duration:0.9,repeat:Infinity,ease:'linear'}}>⟳</motion.span>
                  Checking Safety...
                </span>
              ) : '⬡ Check Safety'}
            </button>

            {error && (
              <div style={{padding:'10px 14px',background:'var(--red-dim)',border:'1px solid rgba(255,77,106,0.3)',borderRadius:10,fontSize:13,color:'var(--red)'}}>
                {error}
              </div>
            )}
          </div>

          {/* ── Right results panel ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {/* Safety badge */}
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                    style={{
                      padding: '28px 24px',
                      borderRadius: 20,
                      border: `2px solid ${result.is_safe ? 'rgba(0,232,120,0.5)' : 'rgba(255,77,106,0.5)'}`,
                      background: result.is_safe
                        ? 'linear-gradient(135deg, rgba(0,232,120,0.06), rgba(0,232,120,0.02))'
                        : 'linear-gradient(135deg, rgba(255,77,106,0.08), rgba(255,77,106,0.02))',
                      textAlign: 'center',
                      boxShadow: result.is_safe
                        ? '0 0 60px rgba(0,232,120,0.12), inset 0 0 40px rgba(0,232,120,0.04)'
                        : '0 0 60px rgba(255,77,106,0.12), inset 0 0 40px rgba(255,77,106,0.04)',
                    }}
                  >
                    <motion.div
                      animate={result.is_safe
                        ? { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }
                        : { scale: [1, 1.04, 1] }
                      }
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        fontSize: 52, marginBottom: 12, lineHeight: 1,
                        filter: result.is_safe
                          ? 'drop-shadow(0 0 24px rgba(0,232,120,0.7))'
                          : 'drop-shadow(0 0 24px rgba(255,77,106,0.7))',
                      }}
                    >
                      {result.is_safe ? '✓' : '✗'}
                    </motion.div>
                    <div style={{
                      fontSize: 26, fontWeight: 900, letterSpacing: '3px',
                      color: result.is_safe ? '#00e878' : '#ff4d6a',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: 8,
                    }}>
                      {result.is_safe ? 'SAFE STATE' : 'UNSAFE STATE'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6 }}>
                      {result.is_safe
                        ? 'A valid safe sequence exists — system is deadlock-free.'
                        : 'No safe sequence found — system could reach deadlock.'}
                    </div>
                  </motion.div>

                  {/* Safe sequence */}
                  {result.is_safe && result.safe_seq?.length > 0 && (
                    <div className="card" style={{ border: `1px solid ${HEX}20` }}>
                      <div className="section-label" style={{ color: HEX, marginBottom: 16 }}>Safe Execution Sequence</div>
                      <SafeSequenceViz seq={result.safe_seq} color={HEX}/>
                    </div>
                  )}

                  {/* Need matrix */}
                  <div className="card" style={{ border: `1px solid ${HEX}18` }}>
                    <div className="section-label" style={{ marginBottom: 14 }}>Need Matrix (Max − Allocation)</div>
                    <BankerMatrix
                      matrix={result.need}
                      names={names.slice(0, n)}
                      color={COLOR}
                      delay={0}
                    />
                  </div>

                  {/* Steps */}
                  <StepTrace steps={result.steps} color={HEX}/>
                </motion.div>
              ) : !loading ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, minHeight:320 }}>
                  <motion.svg width="72" height="72" viewBox="0 0 32 32" fill="none"
                    animate={{ opacity:[0.08,0.15,0.08] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ color: HEX }}
                  >
                    <polygon points="16,3 29,10 29,22 16,29 3,22 3,10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                  </motion.svg>
                  <p style={{ color:'var(--muted)', fontSize:14 }}>Fill in the matrices and check system safety</p>
                  <button onClick={loadExample} style={{
                    padding:'8px 20px', borderRadius:9,
                    background:`${HEX}12`, border:`1px solid ${HEX}30`,
                    color:COLOR, fontSize:13, fontWeight:600, cursor:'pointer',
                  }}>Try textbook example</button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
