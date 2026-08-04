import { createContext, useContext, useState, type ReactNode } from 'react'

interface LayoutCtx {
  hideBottomNav: boolean
  setHideBottomNav: (v: boolean) => void
}

export const LayoutContext = createContext<LayoutCtx>({
  hideBottomNav: false,
  setHideBottomNav: () => {},
})

export function useLayout() { return useContext(LayoutContext) }

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false)
  return (
    <LayoutContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </LayoutContext.Provider>
  )
}
