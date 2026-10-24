import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Biblioteca() {
  const [libros, setLibros] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(null)
  const [showModalLibro, setShowModalLibro] = useState(false)
  const [showModalCita, setShowModalCita] = useState(null)
  const [citas, setCitas] = useState({})
  const [filtro, setFiltro] = useState('')
  const [formLibro, setFormLibro] = useState({ titulo: '', autor: '', anno: '' })
  const [formCita, setFormCita] = useState({ contenido: '', pagina: '', reflexion: '' })

  useEffect(() => { cargarLibros() }, [])

  async function cargarLibros() {
    setLoading(true)
    const { data } = await supabase.from('libros').select('*').order('titulo')
    setLibros(data || [])
    setLoading(false)
  }

  async function cargarCitas(libroId) {
    const { data } = await supabase
      .from('entradas')
      .select('*')
      .eq('tipo', 'cita')
      .eq('entidad_tipo', 'libro')
      .eq('entidad_id', libroId)
      .order('creado_at', { ascending: false })
    setCitas(prev => ({ ...prev, [libroId]: data || [] }))
  }

  function toggleLibro(libroId) {
    if (abierto === libroId) {
      setAbierto(null)
    } else {
      setAbierto(libroId)
      cargarCitas(libroId)
    }
  }

  async function crearLibro() {
    if (!formLibro.titulo.trim()) return
    await supabase.from('libros').insert({ ...formLibro, anno: formLibro.anno ? Number(formLibro.anno) : null })
    setFormLibro({ titulo: '', autor: '', anno: '' })
    setShowModalLibro(false)
    cargarLibros()
  }

  async function crearCita(libroId) {
    if (!formCita.contenido.trim()) return
    await supabase.from('entradas').insert({
      tipo: 'cita',
      entidad_tipo: 'libro',
      entidad_id: libroId,
      contenido: formCita.contenido,
      pagina: formCita.pagina ? Number(formCita.pagina) : null,
      reflexion: formCita.reflexion,
    })
    setFormCita({ contenido: '', pagina: '', reflexion: '' })
    setShowModalCita(null)
    cargarCitas(libroId)
  }

  async function eliminarCita(citaId, libroId) {
    await supabase.from('entradas').delete().eq('id', citaId)
    cargarCitas(libroId)
  }

  const lista = libros.filter(l =>
    `${l.titulo} ${l.autor || ''}`.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📚 Biblioteca</h1>
        <button className="btn btn-primary" onClick={() => setShowModalLibro(true)}>+ Agregar libro</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-icon">🔍</span>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar libro..." />
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : lista.length === 0 ? (
        <div className="empty"><div className="empty-icon">📚</div><div>No hay libros todavía</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.map(libro => (
            <div key={libro.id}>
              <div
                className="card"
                onClick={() => toggleLibro(libro.id)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div>
                  <div className="card-name" style={{ marginBottom: 2 }}>📖 {libro.titulo}</div>
                  {libro.autor && <div className="card-sub">✍️ {libro.autor}</div>}
                  {libro.anno && <div className="card-sub">📅 {libro.anno}</div>}
                  {(citas[libro.id]?.length > 0) && (
                    <div className="card-sub" style={{ marginTop: 4 }}>
                      💬 {citas[libro.id].length} cita{citas[libro.id].length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--fg3)', marginLeft: 8, flexShrink: 0 }}>
                  {abierto === libro.id ? '▲' : '▼'}
                </span>
              </div>

              {abierto === libro.id && (
                <div className="cuaderno" style={{ marginTop: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>💬 Citas y reflexiones</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={e => { e.stopPropagation(); setShowModalCita(libro.id) }}
                    >
                      + Nueva cita
                    </button>
                  </div>

                  {!citas[libro.id] || citas[libro.id].length === 0 ? (
                    <div style={{ color: 'var(--fg3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                      No hay citas todavía. ¡Agregá una!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {citas[libro.id].map(c => (
                        <div key={c.id} style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderLeft: '3px solid var(--accent)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          position: 'relative',
                        }}>
                          {c.pagina && (
                            <div style={{ fontSize: 11, color: 'var(--fg3)', marginBottom: 4 }}>
                              Pág. {c.pagina}
                            </div>
                          )}
                          <blockquote style={{
                            margin: 0,
                            fontStyle: 'italic',
                            color: 'var(--fg)',
                            lineHeight: 1.6,
                            fontSize: 14,
                          }}>
                            "{c.contenido}"
                          </blockquote>
                          {c.reflexion && (
                            <div style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: '1px solid var(--border)',
                              color: 'var(--fg2)',
                              fontSize: 13,
                            }}>
                              💭 {c.reflexion}
                            </div>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); eliminarCita(c.id, libro.id) }}
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--fg3)',
                              fontSize: 14,
                              padding: '0 4px',
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo libro */}
      {showModalLibro && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModalLibro(false)}>
          <div className="modal">
            <div className="modal-title">Agregar libro</div>
            <div className="form-group">
              <label className="form-label">Título *</label>
              <input autoFocus value={formLibro.titulo} onChange={e => setFormLibro({ ...formLibro, titulo: e.target.value })} placeholder="Título del libro" />
            </div>
            <div className="form-group">
              <label className="form-label">Autor</label>
              <input value={formLibro.autor} onChange={e => setFormLibro({ ...formLibro, autor: e.target.value })} placeholder="Nombre del autor" />
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <input type="number" value={formLibro.anno} onChange={e => setFormLibro({ ...formLibro, anno: e.target.value })} placeholder="Ej: 2021" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModalLibro(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearLibro}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva cita */}
      {showModalCita && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModalCita(null)}>
          <div className="modal">
            <div className="modal-title">Nueva cita</div>
            <div className="form-group">
              <label className="form-label">Cita *</label>
              <textarea
                autoFocus
                value={formCita.contenido}
                onChange={e => setFormCita({ ...formCita, contenido: e.target.value })}
                rows={4}
                placeholder="Escribí la cita tal como aparece en el libro..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Página</label>
              <input
                type="number"
                value={formCita.pagina}
                onChange={e => setFormCita({ ...formCita, pagina: e.target.value })}
                placeholder="Número de página"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tu reflexión</label>
              <textarea
                value={formCita.reflexion}
                onChange={e => setFormCita({ ...formCita, reflexion: e.target.value })}
                rows={2}
                placeholder="¿Qué te hizo pensar esta cita?"
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModalCita(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => crearCita(showModalCita)}>Guardar cita</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
