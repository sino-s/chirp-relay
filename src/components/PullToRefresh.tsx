import type { ComponentChildren } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { RefreshIcon } from './Icons'

const REFRESH_THRESHOLD = 72
const WHEEL_REFRESH_THRESHOLD = 160
const WHEEL_RESET_DELAY = 280

export function PullToRefresh({ children, onRefresh }: { children: ComponentChildren; onRefresh: () => void | Promise<void> }) {
  const startRef = useRef({ x: 0, y: 0, active: false })
  const wheelDistanceRef = useRef(0)
  const wheelResetRef = useRef<number>()
  const refreshingRef = useRef(false)
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => () => {
    if (wheelResetRef.current !== undefined) window.clearTimeout(wheelResetRef.current)
  }, [])

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

  async function refresh() {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    setDistance(52)
    try {
      await Promise.all([Promise.resolve(onRefresh()), new Promise((resolve) => window.setTimeout(resolve, 450))])
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
      setDistance(0)
    }
  }

  async function end() {
    if (!startRef.current.active) return
    startRef.current.active = false
    if (distance < REFRESH_THRESHOLD) {
      setDistance(0)
      return
    }
    await refresh()
  }

  function resetWheel() {
    wheelDistanceRef.current = 0
    if (wheelResetRef.current !== undefined) window.clearTimeout(wheelResetRef.current)
    wheelResetRef.current = undefined
    if (!refreshingRef.current) setDistance(0)
  }

  function wheel(event: WheelEvent) {
    if (event.defaultPrevented || refreshingRef.current) return
    if (window.scrollY > 0 || event.deltaY >= 0 || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      resetWheel()
      return
    }
    event.preventDefault()
    wheelDistanceRef.current += Math.min(Math.abs(event.deltaY), 60)
    setDistance(Math.min(112, Math.round(wheelDistanceRef.current * 0.5)))
    if (wheelResetRef.current !== undefined) window.clearTimeout(wheelResetRef.current)
    if (wheelDistanceRef.current >= WHEEL_REFRESH_THRESHOLD) {
      resetWheel()
      void refresh()
      return
    }
    wheelResetRef.current = window.setTimeout(() => {
      wheelDistanceRef.current = 0
      wheelResetRef.current = undefined
      setDistance(0)
    }, WHEEL_RESET_DELAY)
  }

  return (
    <div class="relative min-h-dvh overscroll-y-contain" onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={() => { startRef.current.active = false; setDistance(0) }} onWheel={wheel}>
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
