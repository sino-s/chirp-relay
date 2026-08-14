import type { ComponentChildren } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { RefreshIcon } from './Icons'

const REFRESH_THRESHOLD = 72

export function PullToRefresh({ children, onRefresh }: { children: ComponentChildren; onRefresh: () => void | Promise<void> }) {
  const startRef = useRef({ x: 0, y: 0, active: false })
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  function start(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch || window.scrollY > 0 || refreshing) return
    startRef.current = { x: touch.clientX, y: touch.clientY, active: true }
  }

  function move(event: TouchEvent) {
    if (!startRef.current.active) return
    const touch = event.touches[0]
    if (!touch) return
    const deltaX = touch.clientX - startRef.current.x
    const deltaY = touch.clientY - startRef.current.y
    if (deltaY <= 0 || Math.abs(deltaX) > deltaY) {
      startRef.current.active = false
      setDistance(0)
      return
    }
    setDistance(Math.min(112, Math.round(deltaY * 0.55)))
  }

  async function end() {
    if (!startRef.current.active) return
    startRef.current.active = false
    if (distance < REFRESH_THRESHOLD) {
      setDistance(0)
      return
    }
    setRefreshing(true)
    setDistance(52)
    await Promise.all([Promise.resolve(onRefresh()), new Promise((resolve) => window.setTimeout(resolve, 450))])
    setRefreshing(false)
    setDistance(0)
  }

  return (
    <div class="relative min-h-dvh overscroll-y-contain" onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={() => { startRef.current.active = false; setDistance(0) }}>
      {distance > 0 ? (
        <div
          class="pointer-events-none fixed left-1/2 z-40 grid size-10 -translate-x-1/2 place-items-center rounded-full border border-line bg-canvas text-accent shadow-lg"
          style={{ top: `calc(env(safe-area-inset-top) + ${Math.max(8, distance - 44)}px)` }}
          role="status"
          aria-live="polite"
          aria-label={refreshing ? '更新中' : distance >= REFRESH_THRESHOLD ? '離して更新' : '引き下げて更新'}
        >
          <span class={refreshing ? 'animate-spin' : ''} style={{ rotate: `${Math.min(distance * 3, 180)}deg` }}><RefreshIcon /></span>
        </div>
      ) : null}
      <div style={{ transform: distance > 0 ? `translateY(${distance}px)` : undefined, transition: startRef.current.active ? 'none' : 'transform 180ms ease-out' }}>{children}</div>
    </div>
  )
}
