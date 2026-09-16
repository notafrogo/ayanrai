import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode, RefObject } from 'react'

import type { Brand } from './SocialWindowState'

export const BrandIcon = ({ brand }: { brand: Brand }) => {
  if (brand === 'github') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" /></svg>
  if (brand === 'linkedin') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.16 7.08A1.92 1.92 0 1 1 5.16 3.24a1.92 1.92 0 0 1 0 3.84ZM3.5 8.5h3.32V20H3.5V8.5Zm5.4 0H12v1.57h.05c.49-.93 1.68-1.9 3.46-1.9 3.7 0 4.38 2.43 4.38 5.59V20h-3.32v-5.52c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92V20H8.9V8.5Z" /></svg>
  if (brand === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.7" r="1" fill="currentColor" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
}

type SocialWindowProps = {
  brand: Brand
  title: string
  href: string
  className: string
  position: { x: number; y: number }
  isMinimized: boolean
  isActive: boolean
  onClose: () => void
  onMinimize: () => void
  onFocus: () => void
  onPositionChange: (position: { x: number; y: number }) => void
  workspaceRef: RefObject<HTMLElement | null>
  children: ReactNode
}

export const SocialWindow = ({ brand, title, href, className, position, isMinimized, isActive, onClose, onMinimize, onFocus, onPositionChange, workspaceRef, children }: SocialWindowProps) => {
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  useEffect(() => {
    if (isDragging) document.body.classList.add('is-window-dragging')
    else document.body.classList.remove('is-window-dragging')
    return () => document.body.classList.remove('is-window-dragging')
  }, [isDragging])

  useEffect(() => {
    const workspace = workspaceRef.current
    const windowElement = workspace?.querySelector(`.${className}`)
    if (!workspace || !windowElement) return
    const maxX = Math.max(0, workspace.clientWidth - windowElement.getBoundingClientRect().width)
    const maxY = Math.max(0, workspace.clientHeight - windowElement.getBoundingClientRect().height)
    const boundedPosition = { x: Math.min(maxX, Math.max(0, position.x)), y: Math.min(maxY, Math.max(0, position.y)) }
    if (boundedPosition.x !== position.x || boundedPosition.y !== position.y) onPositionChange(boundedPosition)
  }, [className, onPositionChange, position, workspaceRef])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    event.preventDefault()
    event.stopPropagation()
    onFocus()
    setIsDragging(true)
    dragStart.current = { pointerX: event.clientX, pointerY: event.clientY, x: position.x, y: position.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    const workspace = workspaceRef.current
    const windowElement = event.currentTarget.closest('.social-window')
    if (!workspace || !windowElement) return
    const maxX = Math.max(0, workspace.clientWidth - windowElement.getBoundingClientRect().width)
    const maxY = Math.max(0, workspace.clientHeight - windowElement.getBoundingClientRect().height)
    onPositionChange({
      x: Math.min(maxX, Math.max(0, dragStart.current.x + event.clientX - dragStart.current.pointerX)),
      y: Math.min(maxY, Math.max(0, dragStart.current.y + event.clientY - dragStart.current.pointerY)),
    })
  }

  const openSocial = () => {
    setIsOpening(true)
    window.setTimeout(() => { window.location.href = href }, 260)
  }

  return <article className={`social-window ${className} ${isMinimized ? 'is-minimized' : ''} ${isOpening ? 'is-opening' : ''}`} style={{ '--window-x': `${position.x}px`, '--window-y': `${position.y}px`, zIndex: isActive ? 4 : 2 } as CSSProperties} onPointerDown={onFocus}>
    <div className="window-bar" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { dragStart.current = null; setIsDragging(false) }} onPointerCancel={() => { dragStart.current = null; setIsDragging(false) }}>
      <span className="window-title"><BrandIcon brand={brand} /> {title}</span>
      <span className="window-controls">
        <button type="button" aria-label={`Minimize ${title}`} title="Minimize" onClick={onMinimize}>−</button>
        <button type="button" aria-label={`Open ${title}`} title="Open social" onClick={openSocial}><span className="window-square" aria-hidden="true" /></button>
        <button type="button" aria-label={`Close ${title}`} title="Close" onClick={onClose}>×</button>
      </span>
    </div>
    {!isMinimized && <div className="window-content">{children}</div>}
  </article>
}
