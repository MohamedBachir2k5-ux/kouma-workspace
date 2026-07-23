import { initials, avatarColor } from '../../lib/utils'

interface AvatarProps {
  firstName: string
  lastName: string
  id?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  src?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

export function Avatar({ firstName, lastName, id = 'u0', size = 'md', src }: AvatarProps) {
  const cls = `${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`

  if (src) {
    return <img src={src} alt={`${firstName} ${lastName}`} className={`${cls} object-cover`} />
  }

  return (
    <div className={`${cls} ${avatarColor(id)}`}>
      {initials(firstName, lastName)}
    </div>
  )
}
