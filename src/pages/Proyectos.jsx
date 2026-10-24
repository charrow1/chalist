import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ESTADOS = {
  planificacion: { label: 'Planificación', badge: 'badge-blue' },
  en_progreso: { label: 'En progreso', badge: 'badge-yellow' },
  pausado: { label: 'Pausado', badge: 'badge-gray' },
  completado: { label: 'Completado', badge: 'badge-green' },
}

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', progreso: 0 })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('proyectos').select('*').order('creado_at', { ascending: false })
    setProyectos(data || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.nombre.trim()) return
    await supabase.from('proyectos').insert({ ...form, estado: 'planificacion', progreso: Number(form.progreso) || 0 })
    setForm({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', progreso: 0 })
    setShowModal(false)
    cargar()
  }

  async function actualizarProgreso(id, progreso) {
    await supabase.from('proyectos').update({ progreso: Number(progreso) }).eq('id', id)
    cargar()
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📁 Proyectos</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo proyecto</button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : proyectos.length === 0 ? (
        <div className="empty"><div className="empty-icon">📁</div><div>No hay proyectos</div></div>
      ) : (
        <div className="grid">
          {proyectos.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div className="card-name">{p.nombre}</div>
                <span className={`badge ${ESTADOS[p.estado]?.badge || 'badge-gray'}`}>
                  {ESTADOS[p.estado]?.label || p.estado}
                </span>
              </div>
              {p.descripcion && <div className="card-sub" style={{ marginBottom: 10 }}>{p.descripcion}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="card-sub">Progreso</span>
                <span className="card-sub">{p.progreso}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.progreso}%` }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={p.progreso}
                  onChange={e => actualizarProgreso(p.id, e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
              {(p.fecha_inicio || p.fecha_fin) && (
                <div className="card-sub" style={{ marginTop: 6 }}>
                  {p.fecha_inicio && `📅 Inicio: ${p.fecha_inicio}`}
                  {p.fecha_inicio && p.fecha_fin && ' · '}
                  {p.fecha_fin && `Fin: ${p.fecha_fin}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nuevo proyecto</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del proyecto" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} placeholder="Objetivos del proyecto..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Fecha inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha fin</label>
                <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear}>Crear proyecto</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
