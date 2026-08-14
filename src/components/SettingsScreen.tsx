import { useEffect, useState } from 'preact/hooks'
import type { RelaySettings } from '../types'
import { normalizeRelayUrl } from '../settings'
import { probeRelay } from '../api/client'
import { CheckIcon, WarningIcon } from './Icons'

interface SettingsScreenProps {
  initial?: RelaySettings
  onSave: (settings: RelaySettings) => void
  onCancel?: () => void
}

export function SettingsScreen({ initial, onSave, onCancel }: SettingsScreenProps) {
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? 'http://localhost:4545')
  const [profileName, setProfileName] = useState(initial?.profileName ?? '')
  const [checking, setChecking] = useState(false)
  const [checkedUrl, setCheckedUrl] = useState(initial?.baseUrl)
  const [error, setError] = useState<string>()

  useEffect(() => {
    setCheckedUrl((current) => current === baseUrl ? current : undefined)
  }, [baseUrl])

  async function checkConnection() {
    setChecking(true)
    setError(undefined)
    try {
      const normalized = normalizeRelayUrl(baseUrl)
      const found = await probeRelay(normalized)
      if (found.length === 0) throw new Error('relay に利用可能なプロフィールがありません。')
      setBaseUrl(normalized)
      setProfileName((current) => found.includes(current) ? current : found[0] ?? '')
      setCheckedUrl(normalized)
    } catch (reason) {
      setCheckedUrl(undefined)
      setError(connectionMessage(reason))
    } finally {
      setChecking(false)
    }
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    try {
      const normalized = normalizeRelayUrl(baseUrl)
      if (checkedUrl !== normalized || !profileName) {
        setError('接続を確認してください。')
        return
      }
      onSave({ baseUrl: normalized, profileName })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '設定を保存できませんでした。')
    }
  }

  return (
    <main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div class="mb-8">
        <div class="mb-5 grid size-14 place-items-center rounded-2xl bg-accent text-2xl font-black text-white">C</div>
        <h1 class="text-3xl font-black tracking-tight">Chirp Relay</h1>
        <p class="mt-2 text-sm leading-6 text-muted">Tailscale 内の twitter-api-safe-relay に接続します。アカウントは接続後にサイドメニューから切り替えられます。</p>
      </div>
      <form class="space-y-5" onSubmit={submit}>
        <div>
          <label class="mb-2 block text-sm font-bold" for="relay-url">Relay URL</label>
          <input
            id="relay-url"
            class="field"
            type="url"
            name="relay-url"
            inputMode="url"
            value={baseUrl}
            onInput={(event) => setBaseUrl(event.currentTarget.value)}
            placeholder="https://machine.tailnet.ts.net"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellcheck={false}
            aria-describedby="relay-url-help"
            required
          />
          <span id="relay-url-help" class="mt-2 block text-xs leading-5 text-muted">公開版では Tailscale Serve の HTTPS URL を指定してください。</span>
        </div>
        <button class="secondary-button w-full" type="button" disabled={checking || !baseUrl.trim()} onClick={checkConnection}>
          {checking ? '確認中…' : checkedUrl ? <><CheckIcon size={18} />接続済み</> : '接続を確認'}
        </button>
        {error ? (
          <div class="flex gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert"><WarningIcon class="shrink-0" size={18} /><span>{error}</span></div>
        ) : null}
        <div class="flex gap-3 pt-2">
          {onCancel ? <button class="secondary-button flex-1" type="button" onClick={onCancel}>キャンセル</button> : null}
          <button class="primary-button flex-1" type="submit" disabled={!checkedUrl || !profileName}>Relay URLを保存</button>
        </div>
      </form>
    </main>
  )
}

function connectionMessage(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : 'relay に接続できませんでした。'
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'relay に接続できません。Tailscale、URL、relayの起動状態、CORS設定を確認してください。'
  }
  return message
}
