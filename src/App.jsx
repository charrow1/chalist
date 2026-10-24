import { useState } from 'react'
import './index.css'
import Tareas from './pages/Tareas'
import Sucursales from './pages/Sucursales'
import Empleados from './pages/Empleados'
import Proveedores from './pages/Proveedores'
import Ideas from './pages/Ideas'
import Proyectos from './pages/Proyectos'
import Biblioteca from './pages/Biblioteca'

const NAV = [
  { id: 'tareas',      icon: '📋', label: 'Tareas' },
  { id: 'sucursales',  icon: '🏪', label: 'Sucursales' },
  { id: 'empleados',   icon: '👥', label: 'Empleados' },
  { id: 'proveedores', icon: '🚚', label: 'Proveedores' },
  { id: 'ideas',       icon: '💡', label: 'Ideas' },
  { id: 'proyectos',   icon: '📁', label: 'Proyectos' },
  { id: 'biblioteca',  icon: '📚', label: 'Biblioteca' },
]

const PAGES = {
  tareas:      Tareas,
  sucursales:  Sucursales,
  empleados:   Empleados,
  proveedores: Proveedores,
  ideas:       Ideas,
  proyectos:   Proyectos,
  biblioteca:  Biblioteca,
}

export default function App() {
  const [section, setSection] = useState('tareas')
  const Page = PAGES[section]

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">Chalist</span>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-btn ${section === n.id ? 'active' : ''}`}
            onClick={() => setSection(n.id)}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </nav>
      <main className="main">
        <Page />
      </main>
    </>
  )
}
