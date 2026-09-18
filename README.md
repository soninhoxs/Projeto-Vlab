# V-Lab - Sistema de Gestão de Solicitações de Atendimento

Sistema full stack para registrar e acompanhar solicitações de atendimento encaminhadas a unidades públicas de saúde.

## Telas

Fila de solicitações (tema claro), criação e detalhe (tema escuro):

![Fila de solicitações](docs/screenshots/fila-solicitacoes.png)

![Nova solicitação](docs/screenshots/nova-solicitacao.png)

![Detalhe da solicitação](docs/screenshots/detalhe-solicitacao.png)

## Tecnologias Utilizadas

### Frontend
- **React** 19.2.8
- **TypeScript** 6.0.2
- **Vite** 8.3.0
- **TanStack React Query** 5.103.1 (gerenciamento de estado assíncrono)
- **Axios** 1.20.0 (cliente HTTP)
- **Lucide React** 1.47.0 (ícones)

### Backend
- **PHP** 8.4
- **Laravel** 13.x
- **PostgreSQL** 15

### Infraestrutura
- **Docker** e **Docker Compose**

## Como Executar

### Pré-requisitos
- Docker Desktop instalado e em execução
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/soninhoxs/Projeto-Vlab.git
cd Projeto-Vlab
```

2. **Inicie os containers com Docker Compose**
```bash
docker compose up -d
```

Isso irá iniciar:
- **PostgreSQL** na porta 5432
- **Backend Laravel** na porta 8000
- **Frontend React** na porta 5173

3. **Aguarde a inicialização**
O backend sobe com imagem PHP já compilada (extensão PostgreSQL + OPcache) e executa **somente as migrations**. O seed não roda no start, para o container subir mais rápido. Para popular dados de exemplo:

```bash
docker exec vlab_backend php artisan db:seed --force
```

4. **Acesse a aplicação**
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/v1

### Variáveis de Ambiente

O arquivo `docker-compose.yml` já contém as configurações necessárias. Para customização, as principais variáveis são:

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| POSTGRES_USER | Usuário do PostgreSQL | vlab_user |
| POSTGRES_PASSWORD | Senha do PostgreSQL | vlab_password |
| POSTGRES_DB | Nome do banco de dados | vlab_db |
| VITE_API_URL | URL da API para o frontend | http://localhost:8000/api/v1 |

## Arquitetura e Decisões Técnicas

### Backend (Laravel)

```
backend/
├── app/
│   ├── Enums/           # Enums PHP 8.1+ para Categoria, Prioridade, Status
│   ├── Http/
│   │   ├── Controllers/Api/  # Controller REST
│   │   └── Requests/         # Form Requests para validação
│   ├── Models/               # Eloquent Model
│   └── Services/             # StatusTransitionService + SolicitacaoQueryService
├── database/
│   ├── factories/            # Factory para dados fictícios
│   ├── migrations/           # Versionamento do schema
│   └── seeders/              # Seed inicial
└── routes/
    └── api.php               # Rotas versionadas (/api/v1)
```

#### Decisões de Arquitetura

1. **Enums Tipados (PHP 8.1+)**: Utilizados para `Categoria`, `Prioridade` e `Status`, garantindo type safety e validação automática.

2. **State Machine para Status**: Implementada no `StatusTransitionService`, centralizando as regras de transição:
   - RECEBIDA → EM_ANALISE, CANCELADA
   - EM_ANALISE → AGENDADA, CANCELADA
   - AGENDADA → CONCLUIDA, CANCELADA
   - CONCLUIDA/CANCELADA → (estados finais)

3. **Form Requests**: Validação desacoplada do controller:
   - `IndexSolicitacaoRequest`: Filtros de listagem, inclusive `data_inicio` / `data_fim` (Y-m-d)
   - `StoreSolicitacaoRequest`: Valida criação com justificativa obrigatória para URGENTE
   - `UpdateStatusRequest`: Valida transição de status

4. **Protocolo Automático**: Gerado no evento `creating` do Model usando `Str::random(10)`.

5. **Filtro por período**: `SolicitacaoQueryService` aplica intervalo em `created_at` (`>= início 00:00:00` e `<= fim 23:59:59`), sem `whereDate` por linha.

6. **Desempenho no Docker**: imagem com OPcache; `PHP_CLI_SERVER_WORKERS=4`; `CACHE_STORE=file`, sessão em memória, fila síncrona; entrypoint só migra (seed manual). Lista aquecida na casa de ~135–185 ms de TTFB.

### Frontend (React + TypeScript)

```
frontend/src/
├── api/                 # Cliente HTTP + cache da lista
├── components/
│   ├── FilterBar.tsx
│   ├── FilterSelect.tsx            # Categoria, prioridade, status
│   ├── FilterDateRange.tsx         # Calendário de período
│   ├── CreateSolicitacaoModal.tsx
│   ├── SolicitacaoDetailModal.tsx
│   ├── LogoVlab.tsx                # Wordmark oficial (PNG)
│   ├── Header.tsx / Sidebar.tsx / ThemeToggle.tsx
│   └── ...
├── hooks/
│   ├── useSolicitacoes.ts          # GET lista com filtros + paginação
│   ├── useSolicitacao.ts           # GET individual
│   └── useSolicitacoesMutations.ts # POST/PATCH + insert no cache
├── utils/               # Datas (BR), máscara, clique fora
├── types/
└── styles/              # Tokens, layout, filtros, tema claro/escuro
```

#### Decisões de Arquitetura

1. **React Query**: Gerencia cache, revalidação e estados de loading/error de forma declarativa.

2. **Hooks Customizados**: Separação entre:
   - `useSolicitacoes`: Listagem com filtros e paginação
   - `useSolicitacoesMutations`: Criação e atualização de status

3. **Tipagem Completa**: Interfaces TypeScript para todos os dados da API, evitando `any`.

4. **Design System**: CSS com variáveis (tokens), temas claro/escuro, componentes reutilizáveis.

5. **Acessibilidade**: Labels `aria-*`, roles semânticos, skip link, navegação por teclado nos filtros e modais.

6. **Calendário próprio**: o período não usa `<input type="date">` nativo (overflow, seleção azul, data inválida indo para a API). Digitação por segmentos `dd/mm/aaaa` + painel com validação local.

7. **Lista após criar**: o `201` confirmado pelo servidor é inserido no cache do React Query (página 1) e a query é invalidada em seguida — sem dado fake otimista.

8. **Tema sem fechar filtros**: clique no toggle claro/escuro não conta como “clique fora”; categoria, prioridade, status e período permanecem abertos.

### Segurança (alinhada ao padrão do dashboard V-Lab)

Controles aplicados com base em OWASP / defesa em profundidade, no mesmo espírito do projeto aprovado ([Gov-combustiveis-dashboard-VLAB](https://github.com/alissonjcjk/Gov-combustiveis-dashboard-VLAB.git)): validação de entrada, mascaramento de identificadores e redução de superfície de ataque.

| Controle | Onde | O que mitiga |
|----------|------|----------------|
| CORS restrito ao frontend | `config/cors.php` | Uso da API por origens não autorizadas |
| Rate limit 60 req/min por IP | `AppServiceProvider` | Abuso e enumeração (DoS) |
| Headers `nosniff` / `DENY` / Referrer | `SecurityHeaders` | Clickjacking e sniffing de MIME |
| Form Requests + Enums | `Index/Store/UpdateStatus` | Injeção de filtros e dados inválidos |
| Mass assignment limitado | `Solicitacao` fillable | Forjar `status` ou `protocolo` |
| Escape de `%` e `_` na busca | `SolicitacaoQueryService` | Wildcard injection em LIKE |
| `strip_tags` nos textos | `StoreSolicitacaoRequest` | XSS armazenado |
| Erros de API sem stack trace | `bootstrap/app.php` | Information disclosure |
| Postgres/API só em localhost | `docker-compose.yml` | Exposição da rede local |
| Cartão SUS mascarado / sem dado inventado | `utils/mask.ts` | Vazamento de identificador de saúde |

O desafio não exige login (fluxo interno de unidade), então a autorização HTTP permanece aberta no recorte local. A proteção fica na validação, na state machine e na superfície mínima da API.

### Contrato entre Frontend e API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v1/solicitacoes` | GET | Lista paginada com filtros (`status`, `categoria`, `prioridade`, `busca`, `data_inicio`, `data_fim`) |
| `/api/v1/solicitacoes` | POST | Cria nova solicitação |
| `/api/v1/solicitacoes/{id}` | GET | Detalhes de uma solicitação |
| `/api/v1/solicitacoes/{id}/status` | PATCH | Atualiza status respeitando state machine |

## Funcionalidades Implementadas

### Frontend
- [x] Tela inicial com KPIs por status
- [x] Listagem paginada de solicitações
- [x] Filtros por status, categoria, prioridade, busca textual e período de criação
- [x] Calendário customizado (digitação `dd/mm/aaaa`, validação local, sem date nativo)
- [x] Barra de filtros em uma linha, sem scroll horizontal
- [x] Formulário de criação com validação (justificativa obrigatória para URGENTE)
- [x] Modal de criação reseta ao fechar; registro novo aparece na lista na hora
- [x] Modal de detalhes com todas as informações
- [x] Ação de atualização de status respeitando state machine
- [x] Estados de loading, erro e vazio
- [x] Tema claro/escuro (filtros abertos não fecham ao trocar o tema)
- [x] Logo oficial V-Lab + favicon da cruz
- [x] Menu hamburger abre e fecha; header alinhado na mesma linha
- [x] Layout responsivo

### Backend
- [x] CRUD de solicitações (Create, Read)
- [x] Atualização de status com validação de transições
- [x] Protocolo único automático
- [x] Validação de campos obrigatórios
- [x] Justificativa obrigatória para prioridade URGENTE
- [x] Paginação e filtros na listagem (incluindo período)
- [x] Migrations e Seeders
- [x] OPcache + workers no `artisan serve` via Docker

## Atualizações desta versão (17/09/2026)

Resumo do que entrou neste commit, para revisão e histórico:

### Filtros
- Filtro **Período** (início/fim) no backend (`data_inicio`, `data_fim`) e no frontend (`FilterDateRange`)
- Calendário próprio: centralizado, seleção verde, datas inválidas (ex.: 99/99/9999) barradas no cliente — não viram erro falso de “servidor”
- Categoria, prioridade e status em dropdown customizado, na mesma linha, mais largos até perto de **Nova Solicitação**
- Fonte da barra mantida; painel do período não vaza da caixa

### Criação e lista
- Fechar o modal sem o X e abrir de novo não reaproveita o estado de sucesso
- Após `201`, a linha confirmada pelo servidor entra no cache da lista (página 1) e a query é revalidada

### Identidade e chrome
- Wordmark oficial (`logo-vlab.png`, fundo transparente); não foi redesenhada
- Favicon = só a cruz (a aba não usa mais a logo inteira em 16×16)
- Título da página: **Solicitações**
- Hamburger **abre e fecha** o menu
- Header (operador, conexão, tema, sino, avatar) alinhado na mesma linha horizontal
- Trocar o tema **não fecha** categoria, prioridade, status nem o calendário

### Backend / Docker
- Query de período em `created_at` (intervalo), não `whereDate`
- Dockerfile com `pdo_pgsql` + OPcache; entrypoint só `migrate`
- Compose: 4 workers PHP, cache file, sessão array, fila sync, `APP_DEBUG=false`
- Testes de API do filtro por período; testes frontend de data e cache da lista

## Funcionalidades Não Implementadas / Limitações

- [ ] Autenticação e autorização
- [ ] Edição de campos após criação (apenas status)
- [ ] Exclusão de solicitações (soft delete)
- [ ] Histórico de mudanças de status
- [ ] Logs estruturados

## Como Executar os Testes

### Backend (PHPUnit)
```bash
docker exec vlab_backend php artisan test
```

Os testes incluem:
- Testes unitários do `StatusTransitionService`
- Testes de transições válidas e inválidas
- Testes de API da listagem com `data_inicio` / `data_fim`

### Frontend
```bash
cd frontend
npm run test:run
```

Os testes incluem máscara do Cartão SUS, parsing/validação de datas BR e inserção da solicitação criada no cache da lista.

## Especificação OpenAPI

A especificação OpenAPI está disponível em:
- Arquivo: `backend/docs/openapi.yaml`

## Uso de Ferramentas de IA

Este projeto foi desenvolvido com auxílio do **Cursor**. As ferramentas de IA foram utilizadas para:

1. **Geração de código**: Componentes React, hooks, CSS, controllers Laravel
2. **Debugging**: Identificação e correção de erros de CSS/layout
3. **Arquitetura**: Sugestões de organização de código e boas práticas
4. **Documentação**: Geração deste README e comentários de código

Todo o código gerado foi revisado, compreendido e adaptado conforme necessário. A pessoa candidata é capaz de explicar todas as decisões técnicas e realizar modificações quando solicitado.

## Estrutura do Docker Compose

```yaml
services:
  db:         # PostgreSQL 15
  backend:    # PHP 8.4 + Laravel (porta 8000)
  frontend:   # Node 20 + Vite (porta 5173)
```

Os serviços iniciam em ordem:
1. PostgreSQL (com healthcheck)
2. Backend (aguarda o banco healthy, executa **migrations**; seed é opcional)
3. Frontend (conecta ao backend via `VITE_API_URL`)

---

Desenvolvido para o processo seletivo V-Lab Cln UFPE.
