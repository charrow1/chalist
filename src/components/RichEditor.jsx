import { useState, useRef, useCallback } from 'react'

// Convierte texto plano con sintaxis simple a HTML visual
// Guardamos el contenido como texto plano con marcadores:
//   **texto** = negrita
//   _texto_ = itálica
//   - texto = lista
//   [] texto = checkbox sin marcar
//   [x] texto = checkbox marcado
//   #tag = tag de color

export function parseContenido(texto) {
  if (!texto) return ''
  const lineas = texto.split('\n')
  return lineas.map(linea => {
    // Checkbox marcado
    if (linea.match(/^\[x\]\s*/i)) {
      const resto = linea.replace(/^\[x\]\s*/i, '')
      return `<div class="ck-check done"><span class="ck-box done">✓</span><span class="ck-text done">${parseLine(resto)}</span></div>`
    }
    // Checkbox vacío
    if (linea.match(/^\[\]\s*/)) {
      const resto = linea.replace(/^\[\]\s*/, '')
      return `<div class="ck-check"><span class="ck-box"></span><span class="ck-text">${parseLine(resto)}</span></div>`
    }
    // Lista
    if (linea.match(/^[-•]\s+/)) {
      const resto = linea.replace(/^[-•]\s+/, '')
      return `<div class="ck-li">• ${parseLine(resto)}</div>`
    }
    // Línea vacía
    if (linea.trim() === '') return '<div class="ck-br"> </div>'
    return `<div class="ck-p">${parseLine(linea)}</div>`
  }).join('')
}

function parseLine(texto) {
  return texto
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/#(\w+)/g, '<span class="ck-tag">#$1</span>')
}

// Extrae tags del contenido
export function extraerTags(texto) {
  if (!texto) return []
  const matches = texto.match(/#(\w+)/g) || []
  return [...new Set(matches.map(t => t.slice(1)))]
}

const COLORES_TAG = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function hashColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return COLORES_TAG[Math.abs(h) % COLORES_TAG.length]
}

export function TagChip({ tag, onRemove }) {
  const color = hashColor(tag)
  return (
    <span className="tag-chip" style={{ '--tag-color': color }}>
      #{tag}
      {onRemove && <button onClick={() => onRemove(tag)} className="tag-remove">×</button>}
    </span>
  )
}

export default function RichEditor({ value, onChange, placeholder = 'Escribí aquí...' }) {
  const textareaRef = useRef()
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const insertAt = useCallback((antes, despues = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = value.slice(start, end)
    const nuevo = value.slice(0, start) + antes + sel + despues + value.slice(end)
    onChange(nuevo)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start + antes.length
      el.selectionEnd = start + antes.length + sel.length
    })
  }, [value, onChange])

  const insertLine = useCallback((prefijo) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    // Busca el inicio de la línea actual
    const antes = value.slice(0, start)
    const lineStart = antes.lastIndexOf('\n') + 1
    const nuevoPrefijo = value.slice(lineStart, lineStart + prefijo.length) === prefijo ? '' : prefijo
    const nuevo = value.slice(0, lineStart) + nuevoPrefijo + value.slice(lineStart)
    onChange(nuevo)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start + nuevoPrefijo.length
      el.selectionEnd = start + nuevoPrefijo.length
    })
  }, [value, onChange])

  const agregarTag = () => {
    if (!tagInput.trim()) return
    const tag = tagInput.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/g, '')
    if (!tag) return
    const nuevoValor = value + (value && !value.endsWith('\n') ? '\n' : '') + `#${tag}`
    onChange(nuevoValor)
    setTagInput('')
    setShowTagInput(false)
  }

  const tags = extraerTags(value)

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button type="button" className="tb-btn" title="Negrita" onClick={() => insertAt('**', '**')}><b>B</b></button>
        <button type="button" className="tb-btn" title="Itálica" onClick={() => insertAt('_', '_')}><i>I</i></button>
        <div className="tb-sep" />
        <button type="button" className="tb-btn" title="Lista" onClick={() => insertLine('• ')}>≡</button>
        <button type="button" className="tb-btn" title="Checkbox" onClick={() => insertLine('[] ')}>☐</button>
        <div className="tb-sep" />
        <button
          type="button"
          className="tb-btn"
          title="Agregar tag"
          onClick={() => setShowTagInput(!showTagInput)}
        >
          🏷️
        </button>
      </div>

      {showTagInput && (
        <div className="tag-input-row">
          <input
            autoFocus
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); agregarTag() }
              if (e.key === 'Escape') setShowTagInput(false)
            }}
            placeholder="Nombre del tag (ej: urgente, precio, reunion)"
            className="tag-input"
          />
          <button type="button" className="btn btn-sm btn-primary" onClick={agregarTag}>Agregar</button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="rich-textarea"
        onKeyDown={e => {
          // Enter en una línea de checkbox o lista → continúa el prefijo
          if (e.key === 'Enter') {
            const el = e.target
            const start = el.selectionStart
            const antes = value.slice(0, start)
            const lineStart = antes.lastIndexOf('\n') + 1
            const lineActual = antes.slice(lineStart)
            let prefijo = ''
            if (lineActual.match(/^\[\]\s+\S/)) prefijo = '[] '
            else if (lineActual.match(/^\[x\]\s+\S/i)) prefijo = '[] '
            else if (lineActual.match(/^[-•]\s+\S/)) prefijo = '• '
            if (prefijo) {
              e.preventDefault()
              const nuevo = value.slice(0, start) + '\n' + prefijo + value.slice(start)
              onChange(nuevo)
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 1 + prefijo.length
              })
            }
          }
        }}
      />

      {tags.length > 0 && (
        <div className="rich-tags">
          {tags.map(t => <TagChip key={t} tag={t} />)}
        </div>
      )}
    </div>
  )
}
