# Songbook

Aplicação para gerenciamento de cifras e setlists para músicos e bandas.

## Features

- **Cifras**: Cadastro e visualização de músicas com acordes
- **Transposição**: Altere o tom das músicas em tempo real
- **Setlists**: Organize músicas em listas para shows e ensaios
- **Notas**: Adicione observações específicas para cada música no setlist
- **Importação**: Extraia cifras automaticamente de URLs (Cifra Club, etc)
- **Atalhos de teclado**: Navegação rápida pela aplicação

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQLite)
- **AI**: Groq API (para extração de cifras)

## Estrutura do Projeto

```
songbook/
├── api/          # Backend (Cloudflare Workers)
├── web/          # Frontend (React + Vite)
└── shared/       # Tipos compartilhados
```

## Setup

### Pré-requisitos

- Node.js 18+
- Yarn
- Conta na Cloudflare (para deploy)

### Instalação

```bash
# Instalar dependências
yarn install

# Rodar frontend em desenvolvimento
yarn workspace @songbook/web dev

# Rodar backend em desenvolvimento
yarn workspace @songbook/api dev
```

### Configuração do Backend

1. Crie um banco D1 na Cloudflare
2. Atualize o `database_id` em `api/wrangler.toml`
3. Execute as migrations:

```bash
cd api
wrangler d1 execute songbook-db --file=schema.sql
wrangler d1 execute songbook-db --file=migrations/0001_add_bpm.sql
wrangler d1 execute songbook-db --file=migrations/0002_add_setlist_song_details.sql
```

4. Configure a variável de ambiente `GROQ_API_KEY` para extração de cifras

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `/` | Buscar música |
| `Esc` | Voltar |
| `+` / `-` | Transpor tom |
| `0` / `9` | Aumentar / diminuir fonte |
| `Space` | Rolar para baixo |
| `Shift+Space` | Rolar para cima |
| `n` | Toggle notas (no setlist) |
| `1-5` | Ir para música do setlist |

## Deploy

```bash
# Deploy do backend
yarn workspace @songbook/api deploy

# Build do frontend
yarn workspace @songbook/web build
```

## License

MIT
