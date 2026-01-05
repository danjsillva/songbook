import { useEffect, useRef, type RefObject } from 'react'

/**
 * Hook para detectar cliques fora de um elemento
 * Substitui o padrão setTimeout(0) que é frágil e causa race conditions
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleClick = (e: MouseEvent) => {
      // Ignora se o clique foi dentro do elemento
      if (ref.current && ref.current.contains(e.target as Node)) {
        return
      }
      handler()
    }

    // Usa mousedown para capturar antes do click
    // Isso evita problemas com elementos que são removidos no click
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [handler, enabled])

  return ref
}
