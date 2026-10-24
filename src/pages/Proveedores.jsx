import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Cuaderno from '../components/Cuaderno'

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', rubro: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('proveedores').select('*').eq('activo', true).order('nombre')
    setProveedores(data || [])
    setLoading(false)
  }

  async function crear() {
    if (!form.nombre.trim()) return
    await supabase.from('proveedores').insert({ ...form, activo: true })
    setForm({ nombre: '', contacto: '', telefono: '', email: '', rubro: '' })
    setShowModal(false)
    cargar()
  }

  const lista = proveedores.filter(p =>
    `${p.nombre} ${p.rubro || ''}`.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">🚚 Proveedores</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nuevo proveedor</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 16, maxWidth: 320 }}>
        <span className="search-icon">🔍</span>
        <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Buscar proveedor..." />
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : lista.length === 0 ? (
        <div className="empty"><div className="empty-icon">🚚</div><div>No hay proveedores</div></div>
      ) : (
        <div className="grid">
          {lista.map(p => (
            <div key={p.id}>
              <div className="card" onClick={() => setAbierto(abierto === p.id ? null : p.id)}>
                <div className="card-name">{p.nombre}</div>
                {p.rubro && <div className="card-sub">📦 {p.rubro}</div>}
                {p.contacto && <div className="card-sub">👤 {p.contacto}</div>}
                {p.telefono && <div className="card-sub">📞 {p.telefono}</div>}
                {p.email && <div className="card-sub">✉️ {p.email}</div>}
              </div>
              {abierto === p.id && (
                <Cuaderno entidadTipo="proveedor" entidadId={p.id} />
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">Nuevo proveedor</div>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input autoFocus value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del proveedor" />
            </div>
            <div className="form-group">
              <label className="form-label">Rubro</label>
              <input value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })} placeholder="Ej: Motos, Electrónica..." />
            </div>
            <div className="form-group">
              <label className="form-label">Contacto</label>
              <input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Nombre del contacto" />
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
