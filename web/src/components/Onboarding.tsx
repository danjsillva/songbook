import { useState } from 'react'
import { Building2, Mail, Loader2, ArrowRight } from 'lucide-react'
import { api } from '../api/client'
import { useWorkspace } from '../contexts/WorkspaceContext'
import type { Workspace } from '@songbook/shared'

type Step = 'choice' | 'create' | 'join'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

export function Onboarding() {
  const { setWorkspace } = useWorkspace()
  const [step, setStep] = useState<Step>('choice')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create workspace form
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  // Join workspace form
  const [inviteToken, setInviteToken] = useState('')

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleCreateWorkspace = async () => {
    if (!name.trim() || !slug.trim()) return

    setLoading(true)
    setError(null)

    try {
      const workspace = await api.workspaces.create({
        name: name.trim(),
        slug: slug.trim(),
      })
      setWorkspace(workspace)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar workspace')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinWorkspace = async () => {
    if (!inviteToken.trim()) return

    setLoading(true)
    setError(null)

    try {
      const workspace = await api.invites.accept(inviteToken.trim())
      setWorkspace(workspace)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite')
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-text-primary placeholder:text-text-muted transition-all duration-200"

  // Choice step
  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary mb-2">Bem-vindo ao Stage</h1>
            <p className="text-text-secondary">Como você gostaria de começar?</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="w-full p-6 bg-surface border border-border rounded-2xl hover:border-accent hover:bg-surface-hover transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary mb-1">Criar workspace</h3>
                  <p className="text-sm text-text-tertiary">
                    Configure um novo espaço para sua igreja ou ministério
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full p-6 bg-surface border border-border rounded-2xl hover:border-accent hover:bg-surface-hover transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary mb-1">Entrar com convite</h3>
                  <p className="text-sm text-text-tertiary">
                    Use um código de convite para entrar em um workspace existente
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create workspace step
  if (step === 'create') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => setStep('choice')}
            className="text-text-tertiary hover:text-text-primary mb-6 text-sm cursor-pointer"
          >
            ← Voltar
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Criar workspace</h1>
            <p className="text-text-secondary">Configure seu espaço de trabalho</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Nome do workspace
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Igreja Batista Central"
                className={inputClasses}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                URL do workspace
              </label>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">stage.app/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    setSlugTouched(true)
                  }}
                  placeholder="minha-igreja"
                  className={`${inputClasses} flex-1`}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Use letras minúsculas, números e hífens
              </p>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateWorkspace}
              disabled={loading || !name.trim() || !slug.trim()}
              className="w-full h-12 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl text-sm font-semibold cursor-pointer disabled:cursor-not-allowed transition-all duration-200 text-bg-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar workspace'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Join workspace step
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => setStep('choice')}
          className="text-text-tertiary hover:text-text-primary mb-6 text-sm cursor-pointer"
        >
          ← Voltar
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Entrar com convite</h1>
          <p className="text-text-secondary">Cole o código de convite que você recebeu</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Código de convite
            </label>
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Cole o código aqui"
              className={inputClasses}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleJoinWorkspace}
            disabled={loading || !inviteToken.trim()}
            className="w-full h-12 bg-accent hover:bg-accent-hover disabled:bg-surface disabled:text-text-muted rounded-xl text-sm font-semibold cursor-pointer disabled:cursor-not-allowed transition-all duration-200 text-bg-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar no workspace'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
