import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { SongListItem, SetlistListItem } from '@songbook/shared'

interface DashboardProps {
  onSelectSong: (id: string) => void
  onSelectSetlist: (id: string) => void
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  const keyParts = keys.split(' ')
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 min-w-[4.5rem]">
        {keyParts.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 bg-neutral-700 rounded text-neutral-300 font-mono text-xs text-center min-w-[1.5rem]"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-neutral-400 text-xs">{label}</span>
    </div>
  )
}

export function Dashboard({ onSelectSong, onSelectSetlist }: DashboardProps) {
  const [recentSongs, setRecentSongs] = useState<SongListItem[]>([])
  const [recentSetlists, setRecentSetlists] = useState<SetlistListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.songs.recent(),
      api.setlists.recent(),
    ]).then(([songs, setlists]) => {
      setRecentSongs(songs)
      setRecentSetlists(setlists)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-neutral-400">Carregando...</div>
      </div>
    )
  }

  const hasRecent = recentSongs.length > 0 || recentSetlists.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Songbook</h1>
          <p className="text-neutral-400 mt-1">Suas musicas e setlists</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {!hasRecent ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-neutral-500 text-lg mb-2">
              Nenhum item recente
            </div>
            <div className="text-neutral-600 text-sm">
              Use os icones na barra lateral para buscar musicas e setlists
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Músicas Recentes */}
              <div>
                <h2 className="text-sm font-semibold mb-4 text-neutral-400 uppercase tracking-wide">
                  Musicas Recentes
                </h2>
                {recentSongs.length === 0 ? (
                  <div className="text-neutral-500 text-sm">Nenhuma musica visitada</div>
                ) : (
                  <div className="space-y-1">
                    {recentSongs.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => onSelectSong(song.id)}
                        className="w-full p-3 text-left rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{song.title}</div>
                          <div className="text-sm text-neutral-400 truncate">{song.artist}</div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {song.bpm && (
                            <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono">
                              {song.bpm}
                            </span>
                          )}
                          {song.originalKey && (
                            <span className="px-2 py-1 bg-amber-900/50 text-amber-400 rounded text-sm font-mono">
                              {song.originalKey}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Setlists Recentes */}
              <div>
                <h2 className="text-sm font-semibold mb-4 text-neutral-400 uppercase tracking-wide">
                  Setlists Recentes
                </h2>
                {recentSetlists.length === 0 ? (
                  <div className="text-neutral-500 text-sm">Nenhum setlist visitado</div>
                ) : (
                  <div className="space-y-1">
                    {recentSetlists.map((setlist) => (
                      <button
                        key={setlist.id}
                        onClick={() => onSelectSetlist(setlist.id)}
                        className="w-full p-3 text-left rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{setlist.name}</div>
                          <div className="text-sm text-neutral-400">{formatDate(setlist.date)}</div>
                        </div>
                        <span className="px-2 py-1 bg-neutral-700 text-neutral-300 rounded text-sm font-mono flex-shrink-0">
                          {setlist.songCount}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Atalhos */}
            <div className="bg-neutral-800/50 rounded-xl p-5">
              <h2 className="text-sm font-semibold mb-4 text-neutral-400 uppercase tracking-wide">
                Atalhos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="space-y-2">
                  <div className="text-amber-500 font-medium text-xs uppercase tracking-wide">Geral</div>
                  <Shortcut keys="/" label="Buscar musica" />
                  <Shortcut keys="Esc" label="Voltar" />
                </div>

                <div className="space-y-2">
                  <div className="text-amber-500 font-medium text-xs uppercase tracking-wide">Transposicao</div>
                  <Shortcut keys="+" label="Tom +1" />
                  <Shortcut keys="-" label="Tom -1" />
                </div>

                <div className="space-y-2">
                  <div className="text-amber-500 font-medium text-xs uppercase tracking-wide">Visualizacao</div>
                  <Shortcut keys="0" label="Aumentar fonte" />
                  <Shortcut keys="9" label="Diminuir fonte" />
                </div>

                <div className="space-y-2">
                  <div className="text-amber-500 font-medium text-xs uppercase tracking-wide">Navegacao</div>
                  <Shortcut keys="Space" label="Proxima secao" />
                  <Shortcut keys="⇧ Space" label="Secao anterior" />
                  <Shortcut keys="n" label="Toggle notas" />
                  <Shortcut keys="1-5" label="Ir para musica" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
