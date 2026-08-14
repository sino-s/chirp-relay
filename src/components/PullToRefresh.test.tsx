import { fireEvent, render, screen } from '@testing-library/preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PullToRefresh } from './PullToRefresh'

describe('PullToRefresh', () => {
  beforeEach(() => Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 }))

  it('refreshes after pulling past the threshold at the top', () => {
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh}><p>timeline</p></PullToRefresh>)
    const root = screen.getByText('timeline').parentElement?.parentElement
    fireEvent.touchStart(root!, { touches: [{ clientX: 180, clientY: 80 }] })
    fireEvent.touchMove(root!, { touches: [{ clientX: 180, clientY: 240 }] })
    fireEvent.touchEnd(root!, { changedTouches: [{ clientX: 180, clientY: 240 }] })
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('does not refresh for a short pull', () => {
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh}><p>timeline</p></PullToRefresh>)
    const root = screen.getByText('timeline').parentElement?.parentElement
    fireEvent.touchStart(root!, { touches: [{ clientX: 180, clientY: 80 }] })
    fireEvent.touchMove(root!, { touches: [{ clientX: 180, clientY: 120 }] })
    fireEvent.touchEnd(root!, { changedTouches: [{ clientX: 180, clientY: 120 }] })
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('refreshes after continued upward wheel scrolling at the top', () => {
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh}><p>timeline</p></PullToRefresh>)
    const root = screen.getByText('timeline').parentElement?.parentElement

    fireEvent.wheel(root!, { deltaX: 0, deltaY: -60 })
    fireEvent.wheel(root!, { deltaX: 0, deltaY: -60 })
    expect(onRefresh).not.toHaveBeenCalled()
    fireEvent.wheel(root!, { deltaX: 0, deltaY: -60 })

    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('does not accumulate wheel refresh while the page is above the top', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 10 })
    const onRefresh = vi.fn()
    render(<PullToRefresh onRefresh={onRefresh}><p>timeline</p></PullToRefresh>)
    const root = screen.getByText('timeline').parentElement?.parentElement

    fireEvent.wheel(root!, { deltaX: 0, deltaY: -240 })

    expect(onRefresh).not.toHaveBeenCalled()
  })
})
