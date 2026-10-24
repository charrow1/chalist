import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Timeline from '../components/Timeline'

function DetalleSucursal({ sucursal, onVolver }) {
  return (
    <div className="detalle-panel">
      <div className="detalle-header">
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
        <div className="detalle-info">
          <h1 className="detalle-nombre">{sucursal.nombre}</h1>
          <div className="detalle-meta">
            {sucursal.encargado && <span>👤 {sucursal.encargado}</span>}
            {sucursal.direccion && <span>📍 {sucursal.direccion}</span>}
            {sucursal.telefono && <span>📞 {sucursal.telefono}</span>}
            <span className="badge badge-green">Activa</span>
          </div>
        </div>
      </div>
      <div className="detalle-body">
        <Timeline entidadTipo="sucursal" entidadId={sucursal.id} />
      </div>
    </div>
  )
}

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState({ nombre: '', direccion: '', telefono: '', encargado: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('sucursales').select('*').eq('activa', true).order('nombre')
    setSucursales(data || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.nombre.trim()) return
    await supabase.from('sucursales').insert({ ...form, activa: true })
    setForm({ nombre: '', direccion: '', telefono: '', encargado: '' })
    setShowModal(false)
    cargar()
  }

  // Vista fullscreen del detalle
  if (detalle) {
    return <DetalleSucursal sucursal={detalle} onVolver={() => setDetalle(null)} />
  }

  const lista = sucursales.filter(s => s.nombre.toLowerCase().includes(filtro.toLowerCase()))

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🏪 Sucursales</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva sucursal</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-icon">🔍</span>
        <input
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar sucursal..."
        />
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : lista.length === 0 ? (
        <div className="empty"><div className="empty-icon">🏪</div><div>No hay sucursales</div></div>
      ) : (
        <div className="grid">
          {lista.map(s => (
            <div
              key={s.id}
              className="card card-clickable"
              onClick={() => setDetalle(s)}
            >
              <div className="card-name">{s.nombre}</div>
              {s.encargado && <div className="card-sub">👤 {s.encargado}</div>}
              {s.direccion && <div className="card-sub">📍 {s.direccion}</div>}
              {s.telefono && <div className="card-sub">📞 {s.telefono}</div>}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-green">Activa</span>
                <span className="card-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nueva sucursal</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la sucursal" />
            </div>
            <div className="form-group">
              <label className="form-label">Encargado</label>
              <input value={form.encargado} onChange={e => setForm({ ...form, encargado: e.target.value })} placeholder="Nombre del encargado" />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono de contacto" />
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crear}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
