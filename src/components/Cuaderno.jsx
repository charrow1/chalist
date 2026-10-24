import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'tarea', label: '📋 Tareas' },
  { id: 'tema', label: '💬 Temas' },
  { id: 'nota', label: '📝 Notas' },
  { id: 'foto', label: '📷 Fotos' },
]

export default function Cuaderno({ entidadTipo, entidadId }) {
  const [tab, setTab] = useState('tarea')
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (entidadId) cargar()
  }, [entidadId, tab])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('entradas')
      .select('*')
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .eq('tipo', tab)
      .order('creado_at', { ascending: false })
    setEntradas(data || [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.titulo.trim() && !form.contenido.trim()) return
    await supabase.from('entradas').insert({
      tipo: tab,
      titulo: form.titulo || null,
      contenido: form.contenido || null,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      prioridad: tab === 'tarea' ? form.prioridad : null,
      vencimiento: tab === 'tarea' && form.vencimiento ? form.vencimiento : null,
      estado: tab === 'tarea' ? 'pendiente' : null,
    })
    setForm({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
    setAdding(false)
    cargar()
  }

  async function toggleTarea(e) {
    const nuevoEstado = e.estado === 'completada' ? 'pendiente' : 'completada'
    await supabase.from('entradas').update({ estado: nuevoEstado }).eq('id', e.id)
    cargar()
  }

  return (
    <div className="cuaderno">
      <div className="cuaderno-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`cuaderno-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="cuaderno-body">
        {loading ? (
          <div style={{ color: 'var(--fg3)', fontSize: 13 }}>Cargando...</div>
        ) : (
          <>
            {entradas.map(e => (
              <div key={e.id} className="entrada">
                {tab === 'tarea' ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      className={`tarea-check ${e.estado === 'completada' ? 'done' : ''}`}
                      style={{ marginTop: 2 }}
                      onClick={() => toggleTarea(e)}
                    />
                    <div>
                      <div className={`entrada-titulo ${e.estado === 'completada' ? 'done' : ''}`} style={e.estado === 'completada' ? { textDecoration: 'line-through', color: 'var(--fg3)' } : {}}>
                        {e.titulo}
                      </div>
                      {e.contenido && <div className="entrada-meta">{e.contenido}</div>}
                      {e.vencimiento && <div className="entrada-meta">📅 {e.vencimiento}</div>}
                    </div>
                  </div>
                ) : (
                  <>
                    {e.titulo && <div className="entrada-titulo">{e.titulo}</div>}
                    {e.contenido && <div style={{ fontSize: 13, color: 'var(--fg2)', marginTop: 4 }}>{e.contenido}</div>}
                  </>
                )}
              </div>
            ))}

            {adding ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginTop: 8 }}>
                {(tab === 'tarea' || tab === 'tema') && (
                  <input
                    autoFocus
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    placeholder={tab === 'tarea' ? 'Título de la tarea...' : 'Tema...'}
                    style={{ marginBottom: 8 }}
                  />
                )}
                <textarea
                  value={form.contenido}
                  onChange={e => setForm({ ...form, contenido: e.target.value })}
                  placeholder={tab === 'nota' ? 'Escribí tu nota...' : tab === 'foto' ? 'Descripción...' : 'Detalles...'}
                  rows={2}
                  style={{ marginBottom: 8 }}
                />
                {tab === 'tarea' && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })} style={{ flex: 1 }}>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                    <input type="date" value={form.vencimiento} onChange={e => setForm({ ...form, vencimiento: e.target.value })} style={{ flex: 1 }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={guardar}>Guardar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setAdding(false)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => setAdding(true)}
              >
                + Agregar {tab === 'tarea' ? 'tarea' : tab === 'tema' ? 'tema' : tab === 'nota' ? 'nota' : 'foto'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
