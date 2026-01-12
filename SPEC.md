# Songbook - Especificação de Produto

## Filosofia Central

**Performance e responsividade são as features mais importantes.**

Este não é apenas mais um app de cifras. É uma ferramenta profissional para músicos que precisam de confiabilidade absoluta no momento mais crítico: ao vivo.

---

## Dois Mundos, Duas Prioridades

### 1. Modo Performance (Leitura & Navegação)

**Contexto:** Palco, pouca luz, muita pressão, sem margem para erro.

**Prioridade absoluta:** VELOCIDADE e CLAREZA

#### Diretrizes:

- **Zero loading states visíveis** - tudo deve estar pré-carregado ou cached
- **Transições instantâneas** - máximo 16ms (1 frame)
- **Touch targets grandes** - mínimo 48px, idealmente 56px+
- **Alto contraste** - legibilidade em qualquer condição de luz
- **Gestos intuitivos** - scroll suave, swipe entre músicas
- **Sem distrações** - UI minimalista, foco total na cifra
- **Modo escuro otimizado** - padrão para ambientes de palco

#### Métricas de Sucesso:

- First Contentful Paint < 100ms (cached)
- Time to Interactive < 200ms
- Smooth scroll 60fps constante
- Zero jank durante navegação

---

### 2. Modo Gestão (Cadastro & Organização)

**Contexto:** Preparação, ensaio, organização do repertório.

**Prioridade:** INTELIGÊNCIA e PRODUTIVIDADE

#### O Problema do Mercado:

O padrão CifraClub existe há décadas sem evolução significativa. Músicos ainda:

- Digitam cifras manualmente
- Copiam/colam de sites
- Não têm ferramentas inteligentes de organização
- Perdem tempo com formatação

#### Nossa Abordagem - IA como Copiloto:

**Importação Inteligente:**

- Cole um link do CifraClub → extração automática
- Cole um link do YouTube → extração automática

**Organização Assistida:**

- Detecção automática de tom
- Detecção automática de bpm
- Detecção inteligente de músicas similares/duplicadas

**Edição Potencializada:**

- Transposição com preview em tempo real
- Formatação inteligente de seções

---

## Princípios de Design

1. **Palco primeiro** - toda feature deve ser testada mentalmente: "isso funciona com uma mão, no escuro, nervoso?"

2. **Não-intrusivo** - IA sugere, nunca impõe

3. **Consistente** - mesmos gestos, mesmas posições, sempre

---

## Anti-Patterns (O que NÃO fazer)

- Modais que bloqueiam durante performance
- Loading spinners em fluxos críticos
- Animações que atrasam interação
- UI que muda de layout inesperadamente
- Botões pequenos ou muito próximos
- Texto com baixo contraste
- Features que requerem precisão de toque

---

## Princípios Técnicos

### Performance Paranóica

- **Stale-while-revalidate** - mostrar cache instantâneo, atualizar em background
- **Prefetch agressivo** - carregar dados antes do usuário precisar
- **Bundle mínimo** - cada KB de JS importa
- **Workers edge** - latência mínima de rede (Cloudflare)
- **Zero loading spinners** em navegação normal

### Regras para Novas Features

- Não pode adicionar loading state visível em fluxos existentes
- Não pode aumentar bundle > 20kb sem justificativa
- Não pode bloquear render inicial
- Medir before/after com Lighthouse
