import { createContext, useContext, useState, type ReactNode } from 'react'

interface MobileControlsContextValue {
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
  toggle: () => void
}

const MobileControlsContext = createContext<MobileControlsContextValue | null>(null)

export function MobileControlsProvider({ children }: { children: ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(true)

  const toggle = () => setIsMinimized(m => !m)

  return (
    <MobileControlsContext.Provider value={{ isMinimized, setIsMinimized, toggle }}>
      {children}
    </MobileControlsContext.Provider>
  )
}

export function useMobileControls() {
  const context = useContext(MobileControlsContext)
  if (!context) {
    throw new Error('useMobileControls must be used within MobileControlsProvider')
  }
  return context
}
