PRD — Songbook Pessoal (MVP)

1. Visão Geral
   Um aplicativo pessoal para buscar, visualizar e transpor cifras em contexto de palco, com foco absoluto em velocidade, legibilidade e confiabilidade, usando um fluxo simples de importação via HTML.
2. Objetivo do Produto
   Permitir que o usuário:
   encontre uma música em segundos,
   leia a cifra com clareza em ambiente de palco,
   ajuste a tonalidade instantaneamente,
   sem distrações visuais ou fricção operacional.
3. Fora de Escopo (não-objetivos do MVP)
   IA para gerar cifras
   Scraping/coleta automática
   Compartilhamento público
   Autenticação de usuários
   Favoritos
   Playlists / setlists (planejado para versões futuras, já considerando músicas “pré-transpostas”)
   Auto-scroll
   Editor avançado
4. Persona e Contexto
   Usuário: músico tocando ao vivo
   Contexto:
   Pouca luz
   Pressão de tempo
   Uso em notebook/tablet
   Necessidade de leitura à distância
   Possíveis mudanças de tom “em cima da hora”
   Implicação de design:
   Tudo prioriza contraste, tamanho de fonte, poucos cliques e rapidez.
5. Decisões de Produto (consolidadas)
   Dimensão Decisão
   Entrada HTML
   Armazenamento Conversão para modelo canônico
   Viewer Acordes acima da letra
   Transposição Semitom
   Busca Título + artista + full-text
   Auth Não (single-user)
   Idioma PT-BR
   Playlists Fora do MVP
6. Escopo Funcional do MVP
   6.1 Importação de Música
   Usuário pode:
   Colar HTML ou enviar arquivo .html
   Informar/editar:
   Título
   Artista
   Tom original (opcional)
   Sistema deve:
   Converter HTML → modelo canônico interno
   Gerar versão “plain text” para indexação
   Persistir a música
   Torná-la imediatamente buscável
   Critérios de aceite
   Música aparece na busca logo após salvar
   Viewer abre corretamente
   6.2 Biblioteca
   Lista simples de músicas
   Ordenação por:
   mais recentes (default)
   Sem favoritos no MVP
   6.3 Busca
   Requisitos
   Campo focado automaticamente ao abrir o app
   Busca incremental (tempo real)
   Critérios:
   título
   artista
   conteúdo (letra + acordes)
   Critérios de aceite
   Buscar um trecho da letra retorna a música correta
   Nenhum atraso perceptível na digitação
   6.4 Viewer — Modo Palco
   Layout
   Tema escuro (default)
   Fonte grande e legível
   Acordes renderizados em linha acima da letra
   Largura de coluna confortável
   Zero ruído visual
   Controles
   Aumentar / diminuir fonte
   Transpor tom (+ / –)
   Exibir tom atual
   Critérios de aceite
   Leitura confortável à distância
   Transposição sem “pulos” visuais
   Nenhum elemento não essencial visível
   6.5 Transposição
   Requisitos
   Transpor por semitom
   Operar apenas sobre tokens de acorde
   Texto da letra nunca é alterado
   Toggle:
   preferir sustenidos
   preferir bemóis
   Critérios de aceite
   Acordes corretos após múltiplas transposições
   Resposta instantânea
7. Modelo Conceitual (Produto)
   Música
   Identidade (id)
   Metadados (título, artista, tom original)
   Conteúdo canônico (linhas + acordes)
   Conteúdo plain text (para busca)
   Modelo Canônico (conceito)
   Música composta por linhas
   Cada linha contém:
   letra
   acordes com posição relativa
   Princípio-chave:
   Transposição atua apenas nos acordes, nunca no texto.
8. UX e Interações
   Atalhos (MVP)
   Ação Atalho
   Focar busca /
   Abrir música Enter
   Voltar Esc
   Transpor + / -
   Fonte Botões ou A+/A-
   Comportamentos esperados
   Abrir app → foco direto na busca
   Viewer ocupa quase toda a tela
   Navegação previsível, sem estados confusos
9. Requisitos Não-Funcionais
   Busca percebida como instantânea
   Viewer estável (sem reflow perceptível)
   Compatível com Safari
   Uso possível mesmo com conexão instável (dados já carregados)
10. Riscos e Mitigações
    Risco Mitigação
    HTML inconsistente Parser tolerante + preview
    Escopo crescer cedo Playlists, IA e scraping fora do MVP
    Alteração acidental Escrita protegida por token (serverless)
11. Roadmap Pós-MVP (direção)
    Playlists / setlists (com músicas já salvas em tons específicos)
    Navegação próxima/anterior
    Auto-scroll
    PWA / offline first
    Import de PDF
    IA assistida (rascunho)
