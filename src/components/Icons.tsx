import type { JSX } from 'preact'

interface IconProps extends JSX.SVGAttributes<SVGSVGElement> {
  size?: number
}

function Icon({ size = 22, children, ...props }: IconProps): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export function HomeIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m3 11 9-8 9 8v10h-6v-7H9v7H3z" /></Icon>
}

export function UserIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
}

export function SettingsIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></Icon>
}

export function RefreshIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M6.1 9a7 7 0 0 1 11.5-2.6L20 11M4 13l2.4 4.6A7 7 0 0 0 17.9 15" /></Icon>
}

export function ReplyIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></Icon>
}

export function RepostIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></Icon>
}

export function HeartIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></Icon>
}

export function ViewsIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon>
}

export function CalendarIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></Icon>
}

export function LinkIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></Icon>
}

export function CheckIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m20 6-11 11-5-5" /></Icon>
}

export function WarningIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>
}

export function SearchIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></Icon>
}

export function BellIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></Icon>
}

export function BackIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>
}

export function CloseIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M18 6 6 18M6 6l12 12" /></Icon>
}

export function ChevronLeftIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>
}

export function ChevronRightIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>
}

export function PlayIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path fill="currentColor" stroke="none" d="m8 5 11 7-11 7z" /></Icon>
}

export function LockIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
}

export function ComposeIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></Icon>
}

export function ListIcon(props: IconProps): JSX.Element {
  return <Icon {...props}><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></Icon>
}
