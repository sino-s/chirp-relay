import { useEffect, useRef, useState } from 'preact/hooks'
import { createTweet } from '../api/client'
import type { RelaySettings, ViewerProfile } from '../types'
import { CloseIcon, ComposeIcon } from './Icons'

export function ComposeButton({ onClick }: { onClick: () => void }) {
  return (
    <button class="compose-fab mobile-bottom-chrome fixed z-40 grid size-14 place-items-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-[#1a8cd8]" type="button" onClick={onClick} aria-label="ポストする">
      <ComposeIcon size={27} />
    </button>
  )
}

export function Composer({ settings, profile, onClose, onPosted }: { settings: RelaySettings; profile?: ViewerProfile; onClose: () => void; onPosted: (tweetId: string) => void }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>()
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const remaining = 280 - text.length

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    textareaRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sending) onClose()
      if (event.key !== 'Tab') return
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled])') ?? [])]
      if (focusable.length === 0) return
      const current = focusable.indexOf(document.activeElement as HTMLElement)
      const next = event.shiftKey
        ? focusable[(current <= 0 ? focusable.length : current) - 1]
        : focusable[(current + 1) % focusable.length]
      event.preventDefault()
      next?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, sending])

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    setError(undefined)
    try {
      const tweetId = await createTweet(settings, value)
      onPosted(tweetId)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '投稿できませんでした。')
      setSending(false)
    }
  }

  return (
    <div class="fixed inset-0 z-[70] grid items-start bg-black/45 p-0 sm:place-items-center sm:p-4" onClick={(event) => { if (event.target === event.currentTarget && !sending) onClose() }}>
      <div ref={dialogRef} class="flex max-h-dvh min-h-56 w-full flex-col bg-canvas pt-[env(safe-area-inset-top)] sm:max-w-lg sm:rounded-2xl sm:pt-0" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <form onSubmit={submit}>
          <header class="flex h-14 items-center justify-between px-2">
            <button class="icon-button" type="button" onClick={onClose} disabled={sending} aria-label="投稿画面を閉じる"><CloseIcon /></button>
            <h2 id="composer-title" class="sr-only">新しいポスト</h2>
            <button class="primary-button min-h-9 px-4 py-1.5" type="submit" disabled={!text.trim() || remaining < 0 || sending}>{sending ? '送信中' : 'ポストする'}</button>
          </header>
          <div class="flex gap-3 px-4 pb-4">
            {profile?.avatarUrl ? <img class="size-10 shrink-0 rounded-full bg-subtle" src={profile.avatarUrl} width="40" height="40" alt="" /> : <span class="size-10 shrink-0 rounded-full bg-subtle" />}
            <div class="min-w-0 flex-1">
              <textarea ref={textareaRef} class="min-h-36 w-full resize-none bg-transparent py-2 text-xl leading-7 outline-none placeholder:text-muted" value={text} onInput={(event) => setText(event.currentTarget.value)} maxLength={280} placeholder="いまどうしてる？" aria-label="ポスト本文" disabled={sending} />
              <div class="flex items-center justify-end border-t border-line pt-3">
                <span class={`text-sm tabular-nums ${remaining <= 20 ? 'text-danger' : 'text-muted'}`} aria-live="polite">{remaining}</span>
              </div>
              {error ? <p class="mt-2 text-sm text-danger" role="alert">{error}</p> : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
