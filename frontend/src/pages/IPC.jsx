import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { runIPC } from '../api.js'
import IPCThread from '../components/IPCThread.jsx'
import NumInput from '../components/NumInput.jsx'

const DEFAULT_TXS = [
  { client_id: 1, type: 'deposit',  amount: 500 },
  { client_id: 2, type: 'withdraw', amount: 200 },
  { client_id: 3, type: 'deposit',  amount: 300 },
]

export default function IPC() {
  const [clients, setClients] = useState(3)
  const [txs, setTxs]         = useState(DEFAULT_TXS)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const addTx = () => setTxs([...txs, { client_id: 1, type: 'deposit', amount: 100 }])
  const removeTx = i => setTxs(txs.filter((_,idx) => idx !== i))
  const updTx = (i, field, val) =>
    setTxs(txs.map((t,idx) => idx===i ? { ...t, [field]: field==='amount' ? parseFloat(val)||0 : field==='client_id' ? parseInt(val)||1 : val } : t))

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const data = await runIPC({ clients, transactions: txs })
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="module-page" style={{ background: 'var(--bg)' }}>
      <div style={{
        position: 'absolute', top: '20%', right: '-5%', width: '40vw', height: '40vh',
        background: 'radial-gradient(ellipse, rgba(255,122,41,0.06) 0%, transparent 65%)',
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
        <div>
          <h1 style={{ fontSize:17, fontWeight:700, color:'var(--orange)', letterSpacing:'-0.3px' }}>IPC Messaging</h1>
          <p style={{ fontSize:11, color:'var(--muted)', marginTop:1 }}>Message Queue Simulation</p>
        </div>
      </div>

      <div className="module-body" style={{ position:'relative', zIndex:1 }}>
        <div style={{ padding:24, display:'flex', gap:22, alignItems:'flex-start' }}>

          {/* Left */}
          <div style={{ width:310, flexShrink:0, display:'flex', flexDirection:'column', gap:14 }}>

            {/* Clients */}
            <div className="card">
              <div className="section-label">Number of Clients</div>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setClients(n)}
                    style={{
                      flex:1, padding:'9px 0', borderRadius:9,
                      background: clients===n ? 'var(--orange-dim)' : 'var(--surface2)',
                      border: `1px solid ${clients===n ? 'rgba(255,122,41,0.5)' : 'var(--border)'}`,
                      color: clients===n ? 'var(--orange)' : 'var(--muted2)',
                      fontWeight:800, fontSize:15, cursor:'pointer',
                      transition:'all 0.18s',
                      boxShadow: clients===n ? '0 0 14px rgba(255,122,41,0.25)' : 'none',
                    }}>{n}</button>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div className="card" style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div className="section-label" style={{ marginBottom:0 }}>Transactions</div>
                <button onClick={addTx} disabled={txs.length>=10}
                  style={{
                    padding:'4px 13px', borderRadius:7,
                    background:'var(--orange-dim)', border:'1px solid rgba(255,122,41,0.25)',
                    color:'var(--orange)', fontSize:12, fontWeight:700, cursor:'pointer',
                  }}>+ Add</button>
              </div>

              <AnimatePresence>
                {txs.map((tx, i) => (
                  <motion.div key={i}
                    layout
                    initial={{ opacity:0, x:-16, height:0 }}
                    animate={{ opacity:1, x:0, height:'auto' }}
                    exit={{ opacity:0, x:16, height:0 }}
                    transition={{ duration:0.2 }}
                    style={{ overflow:'hidden', marginBottom:8 }}
                  >
                    <div style={{
                      background:'var(--surface2)',
                      border:'1px solid rgba(255,122,41,0.12)',
                      borderLeft:'3px solid var(--orange)',
                      borderRadius:10, padding:'12px 14px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600 }}>Client</span>
                        <div style={{ display:'flex', gap:4 }}>
                          {Array.from({length:clients},(_,k)=>(
                            <button key={k+1} onClick={() => updTx(i,'client_id',k+1)}
                              style={{
                                width:24, height:24, borderRadius:6,
                                background: tx.client_id===k+1 ? 'rgba(255,122,41,0.2)' : 'var(--surface)',
                                border: `1px solid ${tx.client_id===k+1?'rgba(255,122,41,0.5)':'var(--border)'}`,
                                color: tx.client_id===k+1?'var(--orange)':'var(--muted2)',
                                fontWeight:800, fontSize:12, cursor:'pointer',
                                transition:'all 0.15s',
                              }}>{k+1}</button>
                          ))}
                        </div>
                        <button onClick={() => removeTx(i)} style={{
                          marginLeft:'auto', width:22, height:22, borderRadius:5,
                          background:'transparent', border:'1px solid var(--border)',
                          color:'var(--muted)', fontSize:14, cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>×</button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                        {/* Type toggle */}
                        <div>
                          <div style={{ fontSize:9, color:'var(--muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:'1px', fontWeight:700 }}>Type</div>
                          <div style={{ display:'flex', gap:5 }}>
                            {['deposit','withdraw'].map(t => (
                              <button key={t} onClick={() => updTx(i,'type',t)}
                                style={{
                                  flex:1, padding:'5px 0', borderRadius:7, fontSize:11, fontWeight:700,
                                  cursor:'pointer', transition:'all 0.15s',
                                  background: tx.type===t
                                    ? t==='deposit' ? 'rgba(0,232,120,0.15)' : 'rgba(255,77,106,0.15)'
                                    : 'var(--surface)',
                                  border: `1px solid ${tx.type===t ? (t==='deposit'?'rgba(0,232,120,0.4)':'rgba(255,77,106,0.4)') : 'var(--border)'}`,
                                  color: tx.type===t ? (t==='deposit'?'var(--green)':'var(--red)') : 'var(--muted)',
                                }}>{t==='deposit'?'↑ Dep':'↓ Wd'}</button>
                            ))}
                          </div>
                        </div>
                        {/* Amount */}
                        <div>
                          <div style={{ fontSize:9, color:'var(--muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:'1px', fontWeight:700 }}>Amount ($)</div>
                          <NumInput
                            value={tx.amount} onChange={v => updTx(i,'amount',v)}
                            min={0} max={9999} step={50} color="var(--orange)" width="100%"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button className="run-btn" onClick={run} disabled={loading || txs.length===0}
              style={{
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #ff7a29, #ea580c)',
                color: loading ? 'var(--muted2)' : '#fff',
                boxShadow: loading ? 'none' : '0 0 32px rgba(255,122,41,0.3)',
              }}>
              {loading ? (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <motion.span animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}}>⟳</motion.span>
                  Simulating...
                </span>
              ) : '⟳ Simulate'}
            </button>

            {error && (
              <div style={{padding:'10px 14px',background:'var(--red-dim)',border:'1px solid rgba(255,77,106,0.3)',borderRadius:10,fontSize:13,color:'var(--red)'}}>
                {error}
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
                  {/* Summary bar */}
                  <motion.div
                    initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}}
                    style={{
                      background:'rgba(255,122,41,0.07)',
                      border:'1px solid rgba(255,122,41,0.2)',
                      borderRadius:16, padding:'18px 22px',
                      display:'flex', alignItems:'center', gap:18,
                    }}
                  >
                    <div style={{fontSize:36}}>⟳</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:'var(--orange)'}}>Simulation Complete</div>
                      <div style={{fontSize:13,color:'var(--muted2)',marginTop:3}}>{result.summary}</div>
                    </div>
                    <div style={{marginLeft:'auto',textAlign:'right'}}>
                      <div style={{fontSize:32,fontWeight:900,color:'var(--orange)',fontFamily:'monospace'}}>{result.events.length}</div>
                      <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'1px'}}>Events</div>
                    </div>
                  </motion.div>

                  {/* Node viz */}
                  <div className="card" style={{border:'1px solid rgba(255,122,41,0.12)'}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.8px',textTransform:'uppercase',color:'var(--orange)',marginBottom:18}}>Message Flow</div>
                    <IPCThread events={result.events} numClients={clients}/>
                  </div>

                  {/* Timeline */}
                  <div className="card">
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.8px',textTransform:'uppercase',color:'var(--muted)',marginBottom:16}}>Event Timeline</div>
                    <div style={{display:'flex',flexDirection:'column',gap:5}}>
                      {result.events.map((ev,i) => (
                        <motion.div key={i}
                          initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}}
                          transition={{delay:i*0.04}}
                          style={{
                            display:'flex',alignItems:'center',gap:10,
                            padding:'9px 14px',
                            background:'var(--surface2)',
                            border:`1px solid ${ev.type==='send'?'rgba(255,122,41,0.12)':'rgba(0,232,120,0.12)'}`,
                            borderRadius:9,
                          }}
                        >
                          <span style={{fontFamily:'monospace',fontSize:11,color:'var(--muted)',width:55,flexShrink:0}}>t={ev.t}ms</span>
                          <span style={{
                            fontSize:10,fontWeight:700,letterSpacing:'0.5px',textTransform:'uppercase',
                            padding:'2px 8px',borderRadius:999,flexShrink:0,
                            background:ev.type==='send'?'var(--orange-dim)':'var(--green-dim)',
                            border:`1px solid ${ev.type==='send'?'rgba(255,122,41,0.3)':'rgba(0,232,120,0.3)'}`,
                            color:ev.type==='send'?'var(--orange)':'var(--green)',
                          }}>{ev.type==='send'?'▶ SEND':'◀ RECV'}</span>
                          <span style={{fontSize:12,color:'var(--muted2)',flexShrink:0}}>
                            <span style={{color:'var(--cyan)',fontWeight:600}}>{ev.from}</span>
                            {' → '}
                            <span style={{color:'var(--orange)',fontWeight:600}}>{ev.to}</span>
                          </span>
                          <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {ev.msg}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : !loading ? (
                <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
                  style={{display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,minHeight:300}}>
                  <motion.div animate={{rotate:360}} transition={{duration:4,repeat:Infinity,ease:'linear'}} style={{fontSize:64,opacity:0.15}}>⟳</motion.div>
                  <p style={{color:'var(--muted)',fontSize:14}}>Configure clients and transactions, then simulate</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
