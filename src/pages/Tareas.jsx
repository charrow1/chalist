import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PRIORIDADES = { alta: 'badge-red', media: 'badge-yellow', baja: 'badge-green' }

export default function Tareas() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('pendiente')
  const [form, setForm] = useState({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })

  useEffect(() => { cargar() }, [filtro])

  async function cargar() {
    setLoading(true)
    let q = supabase
      .from('entradas')
      .select('*')
      .eq('tipo', 'tarea')
      .order('creado_at', { ascending: false })

    if (filtro !== 'todas') q = q.eq('estado', filtro)

    const { data } = await q
    setTareas(data || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.titulo.trim()) return
    await supabase.from('entradas').insert({
      tipo: 'tarea',
      titulo: form.titulo,
      contenido: form.contenido,
      prioridad: form.prioridad,
      vencimiento: form.vencimiento || null,
      estado: 'pendiente',
      entidad_tipo: 'general',
    })
    setForm({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
    setShowModal(false)
    cargar()
  }

  async function toggleEstado(t) {
    const nuevoEstado = t.estado === 'completada' ? 'pendiente' : 'completada'
    await supabase.from('entradas').update({ estado: nuevoEstado }).eq('id', t.id)
    cargar()
  }

  const FILTROS = [
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'en_progreso', label: 'En progreso' },
    { id: 'completada', label: 'Completadas' },
    { id: 'todas', label: 'Todas' },
  ]

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📋 Tareas</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva tarea</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button
            key={f.id}
            className={`btn btn-sm ${filtro === f.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : tareas.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div>No hay tareas {filtro !== 'todas' ? filtro + 's' : ''}</div>
        </div>
      ) : (
        <div>
          {tareas.map(t => (
            <div key={t.id} className="tarea-item">
              <div
                className={`tarea-check ${t.estado === 'completada' ? 'done' : ''}`}
                onClick={() => toggleEstado(t)}
              />
              <div style={{ flex: 1 }}>
                <div className={`tarea-titulo ${t.estado === 'completada' ? 'done' : ''}`}>
                  {t.titulo}
                </div>
                {t.contenido && (
                  <div className="entry-meta" style={{ color: 'var(--fg2)', fontSize: 12, marginTop: 2 }}>
                    {t.contenido}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {t.prioridad && (
                    <span className={`badge ${PRIORIDADES[t.prioridad] || 'badge-gray'}`}>
                      {t.prioridad}
                    </span>
                  )}
                  {t.vencimiento && (
                    <span className="badge badge-gray">📅 {t.vencimiento}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nueva tarea</div>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input
                autoFocus
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="¿Qué hay que hacer?"
                onKeyDown={e => e.key === 'Enter' && crear()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                value={form.contenido}
                onChange={e => setForm({ ...form, contenido: e.target.value })}
                rows={3}
                placeholder="Detalles opcionales..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Prioridad</label>
                <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vencimiento</label>
                <input
                  type="date"
                  value={form.vencimiento}
                  onChange={e => setForm({ ...form, vencimiento: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear}>Crear tarea</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
