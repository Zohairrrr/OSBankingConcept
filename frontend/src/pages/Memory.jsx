import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { runMemory } from '../api.js'
import MemoryFrames from '../components/MemoryFrames.jsx'
import NumInput from '../components/NumInput.jsx'

const DEFAULT_REFS = [7,0,1,2,0,3,0,4,2,3,0,3,2]

export default function Memory() {
  const [frames, setFrames]     = useState(3)
  const [refInput, setRefInput] = useState('7,0,1,2,0,3,0,4,2,3,0,3,2')
  const [refs, setRefs]         = useState(DEFAULT_REFS)
  const [result, setResult]     = useState(null)
  const [frameData, setFrameData] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const parseRefs = s => {
    const p = s.split(/[\s,]+/).map(x => parseInt(x)).filter(x => !isNaN(x) && x >= 0)
    setRefs(p); return p
  }

  const run = async () => {
    const r = parseRefs(refInput)
    if (!r.length) { setError('Enter at least one page reference'); return }
    setLoading(true); setError(null)
    try {
      const data = await runMemory({ frames, references: r })
      if (data.error) throw new Error(data.error)
      setResult(data)
      const promises = Array.from({length:8},(_,i) => runMemory({frames:i+1,references:r}))
      const results = await Promise.all(promises)
      setFrameData(results.map((d,i) => ({ frames: i+1, FIFO: d.fifo?.faults, LRU: d.lru?.faults })).filter(d => d.FIFO != null))
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="module-page" style={{ background: 'var(--bg)' }}>
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '60vh',
        background: 'radial-gradient(ellipse, rgba(0,232,120,0.05) 0%, transparent 65%)',
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
        <div style={{ width: 1, height: 22, background: 'var(--border2)' }}/>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.3px' }}>Memory Management</h1>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>FIFO · LRU Page Replacement</p>
        </div>
      </div>

      <div className="module-body" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: 24, display: 'flex', gap: 22, alignItems: 'flex-start' }}>

          {/* Left */}
          <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Frame count */}
            <div className="card">
              <div className="section-label">Frame Count</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input type="range" min="1" max="8" value={frames}
                  onChange={e => setFrames(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--green)' }}/>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 28, fontWeight: 900,
                  color: 'var(--green)', minWidth: 32, textAlign: 'right',
                }}>{frames}</span>
              </div>
              {/* Frame preview blocks */}
              <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                {Array.from({length:8},(_,i) => (
                  <motion.div key={i}
                    animate={{
                      background: i < frames ? 'rgba(0,232,120,0.15)' : 'var(--surface2)',
                      borderColor: i < frames ? 'rgba(0,232,120,0.35)' : 'var(--border)',
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                      flex: 1, height: 20, borderRadius: 4,
                      border: '1px solid var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Reference string */}
            <div className="card">
              <div className="section-label">Reference String</div>
              <input
                type="text"
                value={refInput}
                onChange={e => { setRefInput(e.target.value); parseRefs(e.target.value) }}
                placeholder="e.g. 7,0,1,2,0,3"
                style={{
                  width: '100%', marginBottom: 12,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)', borderRadius: 9,
                  padding: '9px 13px', fontFamily: 'Inter', fontSize: 14,
                  outline: 'none',
                }}
              />
              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {refs.map((r, i) => (
                  <motion.div key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 400 }}
                    style={{
                      width: 34, height: 34,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--surface2)',
                      border: '1px solid rgba(0,232,120,0.2)',
                      borderRadius: 8,
                      fontSize: 13, fontWeight: 800,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--green)',
                    }}
                  >{r}</motion.div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                {refs.length} references
              </div>
            </div>

            <button className="run-btn" onClick={run} disabled={loading}
              style={{
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #00e878, #16a34a)',
                color: loading ? 'var(--muted2)' : '#000',
                boxShadow: loading ? 'none' : '0 0 32px rgba(0,232,120,0.25)',
              }}>
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <motion.span animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}}>⟳</motion.span>
                  Running...
                </span>
              ) : '▶ Simulate'}
            </button>

            {error && (
              <div style={{ padding:'10px 14px', background:'var(--red-dim)', border:'1px solid rgba(255,77,106,0.3)', borderRadius:10, fontSize:13, color:'var(--red)' }}>
                {error}
              </div>
            )}

            {/* Stats summary */}
            {result && (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  {label:'FIFO', data:result.fifo, color:'var(--green)', hex:'#00e878'},
                  {label:'LRU',  data:result.lru,  color:'var(--cyan)', hex:'#00d9f5'},
                ].map(({label,data,color,hex}) => (
                  <motion.div key={label}
                    initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                    style={{
                      background:'var(--surface)', border:`1px solid ${hex}22`,
                      borderRadius:14, padding:'14px 16px',
                    }}
                  >
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                      <span style={{fontSize:13,fontWeight:800,color,fontFamily:'monospace'}}>{label}</span>
                      <span style={{
                        fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:999,
                        background:`${hex}15`,border:`1px solid ${hex}30`,color,
                      }}>{(data.hit_ratio*100).toFixed(1)}% hit</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div style={{textAlign:'center',background:'var(--surface2)',borderRadius:10,padding:'10px 0'}}>
                        <div style={{fontSize:24,fontWeight:900,color:'var(--red)',fontFamily:'monospace'}}>{data.faults}</div>
                        <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginTop:2}}>Faults</div>
                      </div>
                      <div style={{textAlign:'center',background:'var(--surface2)',borderRadius:10,padding:'10px 0'}}>
                        <div style={{fontSize:24,fontWeight:900,color,fontFamily:'monospace'}}>{data.hits}</div>
                        <div style={{fontSize:9,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px',marginTop:2}}>Hits</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:18, minWidth:0 }}>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="res"
                  initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                  style={{display:'flex',flexDirection:'column',gap:18}}
                >
                  {/* Side-by-side players */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <MemoryFrames steps={result.fifo.steps} numFrames={frames}
                      label="FIFO" color="var(--green)" colorDim="var(--green-dim)"/>
                    <MemoryFrames steps={result.lru.steps} numFrames={frames}
                      label="LRU" color="var(--cyan)" colorDim="var(--cyan-dim)"/>
                  </div>

                  {/* Chart */}
                  {frameData && (
                    <div className="card" style={{border:'1px solid rgba(0,232,120,0.12)'}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.8px',textTransform:'uppercase',color:'var(--muted)',marginBottom:18}}>
                        Page Faults vs Frame Count
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={frameData} margin={{top:0,right:10,bottom:0,left:-20}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                          <XAxis dataKey="frames" tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false}/>
                          <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,color:'var(--text)',fontSize:13}}/>
                          <Legend wrapperStyle={{color:'var(--muted2)',fontSize:12}}/>
                          <Bar dataKey="FIFO" fill="#00e878" opacity={0.8} radius={[4,4,0,0]}/>
                          <Bar dataKey="LRU"  fill="#00d9f5" opacity={0.8} radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              ) : !loading ? (
                <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,minHeight:300}}>
                  <motion.div animate={{opacity:[0.1,0.2,0.1]}} transition={{duration:3,repeat:Infinity}} style={{fontSize:64,filter:'grayscale(1)'}}>▦</motion.div>
                  <p style={{color:'var(--muted)',fontSize:14}}>Enter a reference string and run the simulation</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
