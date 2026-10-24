import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Timeline from '../components/Timeline'

function DetalleEmpleado({ empleado, onVolver }) {
  return (
    <div className="detalle-panel">
      <div className="detalle-header">
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
        <div className="detalle-info">
          <h1 className="detalle-nombre">{empleado.nombre} {empleado.apellido}</h1>
          <div className="detalle-meta">
            {empleado.cargo && <span>💼 {empleado.cargo}</span>}
            {empleado.sucursales?.nombre && <span>🏪 {empleado.sucursales.nombre}</span>}
            {empleado.telefono && <span>📞 {empleado.telefono}</span>}
            {empleado.email && <span>✉️ {empleado.email}</span>}
          </div>
        </div>
      </div>
      <div className="detalle-body">
        <Timeline entidadTipo="empleado" entidadId={empleado.id} />
      </div>
    </div>
  )
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState({ nombre: '', apellido: '', cargo: '', sucursal_id: '', telefono: '', email: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: emps }, { data: sucs }] = await Promise.all([
      supabase.from('empleados').select('*, sucursales(nombre)').eq('activo', true).order('apellido'),
      supabase.from('sucursales').select('id, nombre').eq('activa', true).order('nombre'),
    ])
    setEmpleados(emps || [])
    setSucursales(sucs || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.nombre.trim()) return
    await supabase.from('empleados').insert({ ...form, sucursal_id: form.sucursal_id || null, activo: true })
    setForm({ nombre: '', apellido: '', cargo: '', sucursal_id: '', telefono: '', email: '' })
    setShowModal(false)
    cargar()
  }

  // Vista fullscreen del detalle
  if (detalle) {
    return <DetalleEmpleado empleado={detalle} onVolver={() => setDetalle(null)} />
  }

  const lista = empleados.filter(e =>
    `${e.nombre} ${e.apellido} ${e.cargo}`.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👥 Empleados</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo empleado</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-icon">🔍</span>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar empleado..." />
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : lista.length === 0 ? (
        <div className="empty"><div className="empty-icon">👥</div><div>No hay empleados</div></div>
      ) : (
        <div className="grid">
          {lista.map(e => (
            <div
              key={e.id}
              className="card card-clickable"
              onClick={() => setDetalle(e)}
            >
              <div className="card-name">{e.nombre} {e.apellido}</div>
              {e.cargo && <div className="card-sub">💼 {e.cargo}</div>}
              {e.sucursales?.nombre && <div className="card-sub">🏪 {e.sucursales.nombre}</div>}
              {e.telefono && <div className="card-sub">📞 {e.telefono}</div>}
              <div className="card-arrow">→</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={ex => ex.target === ex.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nuevo empleado</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <input value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ej: Vendedor, Gerente..." />
            </div>
            <div className="form-group">
              <label className="form-label">Sucursal</label>
              <select value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}>
                <option value="">Sin sucursal asignada</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
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
