import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import RichEditor, { parseContenido, extraerTags, TagChip } from './RichEditor'

const TIPOS = [
  { id: 'todos', label: 'Todos', emoji: '📌' },
  { id: 'tarea', label: 'Tareas', emoji: '📋' },
  { id: 'tema', label: 'Temas', emoji: '💬' },
  { id: 'nota', label: 'Notas', emoji: '📝' },
  { id: 'foto', label: 'Fotos', emoji: '📷' },
  { id: 'doc', label: 'Docs', emoji: '📎' },
]

function formatFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoy = new Date()
  const diff = Math.floor((hoy - d) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return `Hace ${diff} días`
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: d.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined })
}

function formatFechaVenc(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const diff = Math.floor((d - hoy) / 86400000)
  if (diff < 0) return { label: `Venció hace ${-diff}d`, vencida: true }
  if (diff === 0) return { label: 'Vence hoy', urgente: true }
  if (diff === 1) return { label: 'Vence mañana', urgente: true }
  return { label: `Vence en ${diff}d`, vencida: false }
}

// Componente de edición inline para una entrada
function EntradaEdit({ entrada, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    titulo: entrada.titulo || '',
    contenido: entrada.contenido || '',
    prioridad: entrada.prioridad || 'media',
    vencimiento: entrada.vencimiento || '',
  })

  async function guardar() {
    await supabase.from('entradas').update({
      titulo: form.titulo || null,
      contenido: form.contenido || null,
      prioridad: entrada.tipo === 'tarea' ? form.prioridad : null,
      vencimiento: entrada.tipo === 'tarea' && form.vencimiento ? form.vencimiento : null,
      actualizado_at: new Date().toISOString(),
    }).eq('id', entrada.id)
    onGuardar()
  }

  return (
    <div className="entrada-edit">
      {(entrada.tipo === 'tarea' || entrada.tipo === 'tema') && (
        <div className="form-group" style={{ marginBottom: 10 }}>
          <input
            autoFocus
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder={entrada.tipo === 'tarea' ? 'Título...' : 'Tema...'}
          />
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 10 }}>
        {(entrada.tipo === 'nota' || entrada.tipo === 'tema') ? (
          <RichEditor
            value={form.contenido}
            onChange={c => setForm({ ...form, contenido: c })}
            placeholder={entrada.tipo === 'nota' ? 'Escribí tu nota...' : 'Detalles...'}
          />
        ) : (
          <textarea
            value={form.contenido}
            onChange={e => setForm({ ...form, contenido: e.target.value })}
            rows={3}
            placeholder="Detalles..."
          />
        )}
      </div>

      {entrada.tipo === 'tarea' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">⚪ Baja</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Vencimiento</label>
            <input type="date" value={form.vencimiento} onChange={e => setForm({ ...form, vencimiento: e.target.value })} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={guardar}>Guardar</button>
        <button className="btn btn-secondary btn-sm" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}

// Muestra una entrada del timeline
function EntradaItem({ e, onRecargar }) {
  const [editando, setEditando] = useState(false)

  async function toggleTarea() {
    await supabase.from('entradas').update({
      estado: e.estado === 'completada' ? 'pendiente' : 'completada'
    }).eq('id', e.id)
    onRecargar()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar esta entrada?')) return
    await supabase.from('entradas').delete().eq('id', e.id)
    onRecargar()
  }

  const tipo = TIPOS.find(t => t.id === e.tipo)
  const tags = extraerTags(e.contenido)

  if (editando) {
    return (
      <EntradaEdit
        entrada={e}
        onGuardar={() => { setEditando(false); onRecargar() }}
        onCancelar={() => setEditando(false)}
      />
    )
  }

  return (
    <div className="tl-content">
      <div className="tl-meta">
        <span className="tl-tipo">{tipo?.emoji} {tipo?.label?.slice(0, -1)}</span>
        <span className="tl-fecha">{formatFecha(e.creado_at)}</span>
        <div className="tl-acciones">
          <button className="tl-btn-edit" onClick={() => setEditando(true)} title="Editar">✏️</button>
          <button className="tl-btn-delete" onClick={eliminar} title="Eliminar">🗑</button>
        </div>
      </div>

      {e.tipo === 'tarea' && (
        <div className="tl-tarea">
          <div
            className={`tarea-check${e.estado === 'completada' ? ' done' : ''}`}
            onClick={toggleTarea}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={`tl-titulo${e.estado === 'completada' ? ' done' : ''}`}>{e.titulo}</div>
            {e.contenido && <div className="tl-body">{e.contenido}</div>}
            <div className="tl-tags">
              {e.prioridad && (
                <span className={`badge ${e.prioridad === 'alta' ? 'badge-red' : e.prioridad === 'media' ? 'badge-yellow' : 'badge-gray'}`}>
                  {e.prioridad}
                </span>
              )}
              {e.vencimiento && (() => {
                const v = formatFechaVenc(e.vencimiento)
                return v ? <span className={`badge ${v.vencida ? 'badge-red' : v.urgente ? 'badge-yellow' : 'badge-gray'}`}>{v.label}</span> : null
              })()}
            </div>
          </div>
        </div>
      )}

      {(e.tipo === 'tema' || e.tipo === 'nota') && (
        <>
          {e.titulo && <div className="tl-titulo">{e.titulo}</div>}
          {e.contenido && (
            <div
              className="tl-rich-content"
              dangerouslySetInnerHTML={{ __html: parseContenido(e.contenido) }}
            />
          )}
          {tags.length > 0 && (
            <div className="tl-tags" style={{ marginTop: 6 }}>
              {tags.map(t => <TagChip key={t} tag={t} />)}
            </div>
          )}
        </>
      )}

      {e.tipo === 'foto' && (
        <>
          <div className="tl-titulo">{e.titulo}</div>
          {e.contenido && (
            <img src={e.contenido} alt={e.titulo} className="tl-img" onClick={() => window.open(e.contenido, '_blank')} />
          )}
        </>
      )}

      {e.tipo === 'doc' && (
        <a href={e.contenido} target="_blank" rel="noopener noreferrer" className="tl-doc">
          📎 <span>{e.titulo}</span>
        </a>
      )}
    </div>
  )
}

export default function Timeline({ entidadTipo, entidadId }) {
  const [filtro, setFiltro] = useState('todos')
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
  const [subiendo, setSubiendo] = useState(false)
  const fileRef = useRef()

  useEffect(() => { if (entidadId) cargar() }, [entidadId, filtro])

  async function cargar() {
    setLoading(true)
    let q = supabase
      .from('entradas')
      .select('*')
      .eq('entidad_tipo', entidadTipo)
      .eq('entidad_id', entidadId)
      .order('creado_at', { ascending: false })
    if (filtro !== 'todos') q = q.eq('tipo', filtro)
    const { data } = await q
    setEntradas(data || [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.titulo.trim() && !form.contenido.trim()) return
    await supabase.from('entradas').insert({
      tipo: modal,
      titulo: form.titulo || null,
      contenido: form.contenido || null,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      prioridad: modal === 'tarea' ? form.prioridad : null,
      vencimiento: modal === 'tarea' && form.vencimiento ? form.vencimiento : null,
      estado: modal === 'tarea' ? 'pendiente' : null,
    })
    setForm({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
    setModal(null)
    cargar()
  }

  async function subirArchivo(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    const ext = file.name.split('.').pop()
    const esImagen = file.type.startsWith('image/')
    const path = `${entidadTipo}/${entidadId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('archivos').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('archivos').getPublicUrl(path)
      await supabase.from('entradas').insert({
        tipo: esImagen ? 'foto' : 'doc',
        titulo: file.name,
        contenido: publicUrl,
        entidad_tipo: entidadTipo,
        entidad_id: entidadId,
      })
      cargar()
    }
    setSubiendo(false)
    e.target.value = ''
  }

  const abrirModal = (tipo) => {
    setForm({ titulo: '', contenido: '', prioridad: 'media', vencimiento: '' })
    setModal(tipo)
  }

  return (
    <div className="timeline-wrap">
      {/* Filtros */}
      <div className="timeline-filtros">
        {TIPOS.map(t => (
          <button
            key={t.id}
            className={`tl-filtro${filtro === t.id ? ' active' : ''}`}
            onClick={() => setFiltro(t.id)}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Botones agregar */}
      <div className="timeline-acciones">
        <button className="btn btn-sm btn-secondary" onClick={() => abrirModal('tarea')}>📋 Tarea</button>
        <button className="btn btn-sm btn-secondary" onClick={() => abrirModal('tema')}>💬 Tema</button>
        <button className="btn btn-sm btn-secondary" onClick={() => abrirModal('nota')}>📝 Nota</button>
        <button className="btn btn-sm btn-secondary" onClick={() => fileRef.current?.click()}>
          {subiendo ? 'Subiendo...' : '📎 Archivo / Foto'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }} onChange={subirArchivo} />
      </div>

      {/* Entradas */}
      <div className="timeline-lista">
        {loading ? (
          <div className="tl-empty">Cargando...</div>
        ) : entradas.length === 0 ? (
          <div className="tl-empty">
            {filtro === 'todos' ? 'Todavía no hay nada registrado aquí' : `No hay ${TIPOS.find(t => t.id === filtro)?.label.toLowerCase()} todavía`}
          </div>
        ) : entradas.map((e, i) => (
          <div key={e.id} className="tl-item">
            <div className="tl-line-wrap">
              <div className="tl-dot" data-tipo={e.tipo} />
              {i < entradas.length - 1 && <div className="tl-line" />}
            </div>
            <EntradaItem e={e} onRecargar={cargar} />
          </div>
        ))}
      </div>

      {/* Modal crear */}
      {modal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && setModal(null)}>
          <div className={`modal${modal === 'nota' || modal === 'tema' ? ' modal-wide' : ''}`}>
            <div className="modal-title">
              {TIPOS.find(t => t.id === modal)?.emoji} Nueva {modal === 'tarea' ? 'tarea' : modal === 'tema' ? 'tema' : 'nota'}
            </div>

            {(modal === 'tarea' || modal === 'tema') && (
              <div className="form-group">
                <label className="form-label">{modal === 'tarea' ? 'Título *' : 'Tema *'}</label>
                <input
                  autoFocus
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  placeholder={modal === 'tarea' ? 'Ej: Renovar uniforme' : 'Ej: Reunión pendiente'}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && modal === 'tarea' && guardar()}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{modal === 'nota' ? 'Nota *' : 'Detalle'}</label>
              {(modal === 'nota' || modal === 'tema') ? (
                <RichEditor
                  value={form.contenido}
                  onChange={c => setForm({ ...form, contenido: c })}
                  placeholder={modal === 'nota' ? 'Escribí tu nota...' : 'Descripción, links, tags...'}
                />
              ) : (
                <textarea
                  value={form.contenido}
                  onChange={e => setForm({ ...form, contenido: e.target.value })}
                  placeholder="Descripción opcional..."
                  rows={3}
                />
              )}
            </div>

            {modal === 'tarea' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}>
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Media</option>
                    <option value="baja">⚪ Baja</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vencimiento</label>
                  <input type="date" value={form.vencimiento} onChange={e => setForm({ ...form, vencimiento: e.target.value })} />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
