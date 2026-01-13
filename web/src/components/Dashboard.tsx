import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import {
  Music,
  ListMusic,
  Command,
} from 'lucide-react'
import { api } from '../api/client'
import type { SongListItem, SetlistListItem } from '@songbook/shared'
import { Badge } from './Layout'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

interface ShortcutProps {
  keys: string[]
  label: string
}

function Shortcut({ keys, label }: ShortcutProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="min-w-[1.75rem] h-7 px-2 bg-bg-elevated border border-border rounded-lg text-text-secondary font-mono text-xs flex items-center justify-center"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-text-tertiary text-sm">{label}</span>
    </div>
  )
}

interface SongCardProps {
  song: SongListItem
}

function SongCard({ song }: SongCardProps) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="group block p-4 rounded-2xl bg-surface/50 hover:bg-surface border border-transparent hover:border-border transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text-primary truncate group-hover:text-accent transition-colors duration-200">
            {song.title}
          </h3>
          <p className="text-sm text-text-tertiary truncate mt-0.5">{song.artist}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {song.bpm && <Badge size="sm">{song.bpm}</Badge>}
          {song.originalKey && <Badge variant="accent" size="sm">{song.originalKey}</Badge>}
        </div>
      </div>
    </Link>
  )
}

interface SetlistCardProps {
  setlist: SetlistListItem
}

function SetlistCard({ setlist }: SetlistCardProps) {
  return (
    <Link
      href={`/setlists/${setlist.id}`}
      className="group block p-4 rounded-2xl bg-surface/50 hover:bg-surface border border-transparent hover:border-border transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text-primary truncate group-hover:text-accent transition-colors duration-200">
            {setlist.name}
          </h3>
          <p className="text-sm text-text-tertiary mt-0.5">{formatDate(setlist.date)}</p>
        </div>
        <Badge size="sm">{setlist.songCount}</Badge>
      </div>
    </Link>
  )
}

export function Dashboard() {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
          <span className="text-text-tertiary text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  const hasRecent = recentSongs.length > 0 || recentSetlists.length > 0

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {!hasRecent ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-text-tertiary" />
            </div>
            <h2 className="text-lg font-medium text-text-secondary mb-2">
              Nenhum item recente
            </h2>
            <p className="text-text-tertiary text-sm max-w-xs">
              Use a busca para encontrar musicas e setlists ou adicione novos itens
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Recent Songs */}
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <Music className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Musicas Recentes
                  </h2>
                </div>
                {recentSongs.length === 0 ? (
                  <p className="text-text-tertiary text-sm py-4">
                    Nenhuma musica visitada recentemente
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentSongs.map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Setlists */}
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <ListMusic className="w-4 h-4 text-accent" />
                  <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Setlists Recentes
                  </h2>
                </div>
                {recentSetlists.length === 0 ? (
                  <p className="text-text-tertiary text-sm py-4">
                    Nenhum setlist visitado recentemente
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentSetlists.map((setlist) => (
                      <SetlistCard key={setlist.id} setlist={setlist} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Keyboard Shortcuts */}
            <section className="bg-bg-secondary/50 rounded-2xl p-6 lg:p-8 border border-border-subtle">
              <div className="flex items-center gap-2 mb-6">
                <Command className="w-4 h-4 text-accent" />
                <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  Atalhos do Teclado
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-accent uppercase tracking-wide">Geral</h3>
                  <div className="space-y-2">
                    <Shortcut keys={['/']} label="Buscar" />
                    <Shortcut keys={['Esc']} label="Voltar" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-accent uppercase tracking-wide">Tom</h3>
                  <div className="space-y-2">
                    <Shortcut keys={['+']} label="Subir tom" />
                    <Shortcut keys={['-']} label="Descer tom" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-accent uppercase tracking-wide">Fonte</h3>
                  <div className="space-y-2">
                    <Shortcut keys={['0']} label="Aumentar" />
                    <Shortcut keys={['9']} label="Diminuir" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-accent uppercase tracking-wide">Navegacao</h3>
                  <div className="space-y-2">
                    <Shortcut keys={['Space']} label="Proxima secao" />
                    <Shortcut keys={['n']} label="Notas" />
                    <Shortcut keys={['1', '5']} label="Ir para musica" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
