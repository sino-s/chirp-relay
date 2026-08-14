import { fireEvent, render, screen } from '@testing-library/preact'
import { describe, expect, it, vi } from 'vitest'
import { PullToRefresh } from './PullToRefresh'

describe('PullToRefresh', () => {
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
})
