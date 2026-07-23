import { Construction } from 'lucide-react'

interface StubProps {
  title: string
  description?: string
}

export function Stub({ title, description }: StubProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-14 h-14 rounded-2xl bg-indigo-pale flex items-center justify-center mb-4">
        <Construction size={26} className="text-indigo" />
      </div>
      <h2 className="text-lg font-bold text-navy mb-2">{title}</h2>
      <p className="text-sm text-muted max-w-xs leading-relaxed">
        {description || 'Cette section sera disponible dans la prochaine version.'}
      </p>
    </div>
  )
}
