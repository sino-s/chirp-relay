import { routeHref } from '../router'
import type { ViewerProfile } from '../types'
import { LockIcon } from './Icons'

export function UserCard({ user }: { user: ViewerProfile }) {
  return (
    <article class="relative border-b border-line px-4 py-3 transition-colors hover:bg-hover">
      <a class="absolute inset-0 z-10" href={routeHref({ name: 'user', handle: user.handle })} aria-label={`${user.name}のプロフィールを表示`} />
      <div class="flex gap-3">
        {user.avatarUrl ? <img class="size-11 shrink-0 rounded-full bg-subtle" src={user.avatarUrl} width="44" height="44" alt="" loading="lazy" /> : <span class="size-11 shrink-0 rounded-full bg-subtle" />}
        <div class="min-w-0 flex-1">
          <p class="flex items-center gap-1 truncate font-bold">{user.name}{user.protected ? <span class="shrink-0 text-muted" aria-label="非公開アカウント"><LockIcon size={14} /></span> : null}</p>
          <p class="truncate text-sm text-muted">@{user.handle}</p>
          {user.description ? <p class="mt-1 line-clamp-2 break-words text-sm leading-5">{user.description}</p> : null}
          <p class="mt-1 text-xs text-muted">{user.followers.toLocaleString('ja-JP')} フォロワー</p>
        </div>
      </div>
    </article>
  )
}
