import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ESTADOS = {
  nueva: { label: 'Nueva', badge: 'badge-blue' },
  en_evaluacion: { label: 'En evaluación', badge: 'badge-yellow' },
  aprobada: { label: 'Aprobada', badge: 'badge-green' },
  descartada: { label: 'Descartada', badge: 'badge-gray' },
}

export default function Ideas() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('ideas').select('*').order('creado_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.titulo.trim()) return
    await supabase.from('ideas').insert({ ...form, estado: 'nueva' })
    setForm({ titulo: '', descripcion: '', prioridad: 'media' })
    setShowModal(false)
    cargar()
  }

  async function convertirAProyecto(idea) {
    const { data: proy } = await supabase.from('proyectos').insert({
      nombre: idea.titulo,
      descripcion: idea.descripcion,
      estado: 'planificacion',
    }).select().single()

    if (proy) {
      await supabase.from('ideas').update({
        convertida_a_proyecto: true,
        proyecto_id: proy.id,
        estado: 'aprobada',
      }).eq('id', idea.id)
      cargar()
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">💡 Ideas</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva idea</button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : ideas.length === 0 ? (
        <div className="empty"><div className="empty-icon">💡</div><div>No hay ideas todavía</div></div>
      ) : (
        <div className="grid">
          {ideas.map(i => (
            <div key={i.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div className="card-name">{i.titulo}</div>
                <span className={`badge ${ESTADOS[i.estado]?.badge || 'badge-gray'}`}>
                  {ESTADOS[i.estado]?.label || i.estado}
                </span>
              </div>
              {i.descripcion && <div className="card-sub" style={{ marginBottom: 12 }}>{i.descripcion}</div>}
              {!i.convertida_a_proyecto && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => convertirAProyecto(i)}
                >
                  → Convertir en proyecto
                </button>
              )}
              {i.convertida_a_proyecto && (
                <span className="badge badge-green">✅ Convertida en proyecto</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nueva idea</div>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input autoFocus value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="¿Cuál es la idea?" />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Desarrollá la idea..." />
            </div>
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear}>Guardar idea</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
