# CRM Platform — Frontend (app autenticado)

App autenticado da plataforma (SaaS multi-tenant de atendimento via
WhatsApp com IA + CRM). Consome a API do `crm-backend` (repositório
separado, sibling deste diretório — ver `CLAUDE.md` de lá pro contexto
completo de produto/domínio e todas as decisões de arquitetura do
backend). Recriado em 2026-07-22 refletindo o app já construído (não é
mais só planejamento).

## Stack (o que está realmente em uso)

- **React 19 + TypeScript + Vite**.
- **Tailwind CSS v4** + componentes próprios sobre **Radix UI**
  (`@radix-ui/react-*`: dialog, dropdown, select, tabs, switch etc.) —
  estilo shadcn, não é a lib `shadcn/ui` importada pronta.
- **TanStack Query** — todo dado do backend passa por hooks em `src/hooks/`
  (`useEmployees`, `useLeads`, `useConversations` etc.).
- **React Hook Form + Zod** (`@hookform/resolvers`) — formulários.
- **React Router v7** — rotas, com `ProtectedRoute` (`src/routes/`)
  controlando acesso por autenticação.
- **Axios** (não `fetch` cru) — client HTTP central em
  `src/services/apiClient.ts`.
- **Recharts** — gráficos (dashboard).

## Autenticação — como está implementado de verdade

`src/services/apiClient.ts`:
- Token guardado em `localStorage` (`crm.access_token`), anexado como
  `Authorization: Bearer` via interceptor do axios em toda requisição.
- `ApiError` normaliza os dois formatos de erro da API num só formato
  consumível: `status`, `message`, e `fieldErrors` (`Record<string,
  string>`, já mapeado de `detail[].loc`/`msg` do 422 — pronto pra
  `setError` do React Hook Form). Erros de domínio (`{"detail": "string"}`)
  viram só `message`. Essa normalização já existe e funciona — reaproveitar
  sempre, não criar um segundo parser de erro em outro lugar.

`src/contexts/AuthContext.tsx`:
- `login(email, password)` → se vier `requires_company_selection`,
  devolve a lista de empresas pro componente pedir escolha; senão já
  guarda o token.
- `selectCompany(email, password, companyId)` → fecha o login.
- Estado de autenticação vem de `GET /employees/me` via TanStack Query
  (`queryKey: ['auth', 'me']`), habilitado só quando existe token
  guardado. 401/403 na consulta desloga automaticamente.

## ✅ Integrado em 2026-07-23 — permissões efetivas condicionam menu e rotas

O bloqueio de permissões (documentado até 2026-07-22) foi resolvido no
backend (`GET /employees/me/permissions`) e **agora está integrado no
frontend**:
- `AuthContext` (`src/contexts/AuthContext.tsx`) busca `GET
  /employees/me/permissions` junto com `/employees/me` (habilitado só
  depois que o employee carrega) e expõe `hasPermission(module,
  resource, action)`.
- `src/routes/RequirePermission.tsx` — substituiu o antigo `AdminRoute`
  (que usava heurística por nome de cargo, removido). Cada rota
  administrativa (`/employees`, `/roles`, `/assistant`, `/whatsapp`) é
  envolvida individualmente em `App.tsx` com a permissão `VIEW`
  correspondente — quem não tem a permissão é redirecionado pra `/` ao
  tentar acessar direto pela URL, não só escondido do menu.
- `Sidebar.tsx` — a aba "Administrativo" só aparece se o funcionário tem
  pelo menos uma permissão `VIEW` administrativa, e dentro dela só
  listam os itens que ele realmente pode ver (ex: um cargo só com
  `WHATSAPP/whatsapp_instance/VIEW` vê só "WhatsApp" na aba, não os
  outros três). Testado com Owner (todas), um cargo com só uma
  permissão administrativa, e um cargo sem nenhuma.
- **O que ainda não foi feito**: botões de ação *dentro* das páginas
  (ex: "Excluir" num cargo sem `DELETE`, "Novo funcionário" sem
  `CREATE`) ainda não são condicionados por permissão — só
  navegação/rota. Se um funcionário chega numa tela porque tem `VIEW`
  mas não tem `CREATE`/`UPDATE`/`DELETE`, ele ainda vê os botões e só
  descobre que não pode pelo 403 da API. Próximo passo natural de RBAC
  no frontend, mesmo raciocínio de `hasPermission` já pronto pra reusar.

## O que já está construído

Login (com seleção de empresa), Dashboard, e CRUD completo de:
Funcionários (+ diálogo de Horários de Trabalho), Cargos (+ diálogo de
Permissões do cargo), Assistente de IA, WhatsApp (conexão), Leads (+
diálogo de atribuição), Conversas (lista + detalhe + diálogo de
atribuição), Minha empresa (dados cadastrais + encerramento de conta),
Assinatura (ver plano + trocar de plano). Camada de `services/`
espelhando 1:1 os módulos do backend (`employeeService`, `roleService`,
`leadService`, `conversationService`, `assistantService`,
`whatsappInstanceService`, `workScheduleService`, `companyService`,
`subscriptionService`).

## ✅ Corrigido em 2026-07-23 — form de WhatsApp agora bate com o schema real do backend

**Contexto**: o backend implementou webhook real da Meta + envio real +
acionamento automático da IA via n8n — em **modo manual** (sem
CNPJ/Embedded Signup ainda, decisão temporária por restrição financeira,
ver decisão arquitetural #15 e pendência #2 do `CLAUDE.MD` do backend —
**é uma ponte, não a arquitetura final**, vai mudar quando o Tech
Provider existir).

O form de `WhatsappPage.tsx` estava incompleto pro schema
(`WhatsAppInstanceCreate` exige `provider` + `credentials` não-vazio, o
form só mandava `phone_number` → 422 garantido). Corrigido:
- `src/types/whatsappInstance.ts` — `provider` (fixo em
  `'META_CLOUD_API'`, único com implementação real — não expor os
  outros 3 do enum como opção selecionável, eles não funcionam),
  `phone_number_id`, `credentials: { access_token }` (write-only, nunca
  volta em GET), `label`, e `WhatsAppInstanceStatus` ganhou `'ERROR'`.
- `WhatsappPage.tsx` — formulário de criação pede telefone + Phone
  Number ID + token de acesso + nome opcional; formulário de edição
  reusa os mesmos campos mas com token opcional (só envia
  `credentials` no PATCH se o campo foi preenchido — do contrário
  mantém o token salvo). Alert trocado de "conexão real ainda não
  existe" (não era mais verdade) pra explicar o modo manual: nossa
  equipe cadastra o número na Meta e passa os valores pro
  Owner/Admin colar no formulário.
- Testado com o formulário completo renderizando e validando os 3
  campos obrigatórios (screenshots, não testado contra o backend real
  rodando — sem ambiente local disponível nesta sessão).

## ✅ Corrigido em 2026-07-28 — form de Assistente IA agora bate com o schema real do backend

Estava bem atrás do schema: `AssistantCreateRequest` só mandava
`name`/`persona`/`instructions` (esse último nem existe no backend),
mas `POST /assistant` exige também (obrigatórios, `min_length=1`):
`company_context`, `business_rules`, `transfer_rules`, `tone_of_voice`
— o botão "Criar assistente" batia 422 garantido. Corrigido:
- `src/types/assistant.ts` — reescrito pro schema real
  (`app/modules/assistant/schemas.py` do backend): os 4 campos
  obrigatórios acima + `name`/`persona` já existentes, mais os opcionais
  `knowledge_context`/`additional_instructions` (max 8000),
  `welcome_message`/`transfer_message` (max 1000), e `status` (só em
  `Update`/`Read` — não existe em `Create`, o backend sempre cria como
  `ACTIVE`). `compiled_prompt` deixou de ser nullable (backend nunca
  manda `null`, começa como string vazia) e ganhou
  `compiled_prompt_updated_at`.
- `AssistantPage.tsx` — form reconstruído em seções (Identidade / Contexto
  do negócio / Regras de atendimento / Mensagens automáticas), com
  `max_length` do Zod espelhando o backend. `welcome_message`/
  `transfer_message` continuam sendo omitidos do payload quando vazios
  (`|| undefined`), nunca mandados como string vazia — preserva o default
  de plataforma que o backend aplica só quando a chave está ausente.
  Alert trocado de "respostas automáticas ainda não estão ativas" (não
  era mais verdade) pra "mecanismo pronto, aguardando o fluxo do n8n".
- **Toggle de status em destaque** (decisão de produto de 2026-07-27,
  ver histórico): card próprio no topo da tela, só quando o assistant já
  existe, com `Switch` que dispara um `PATCH {status}` isolado (não
  precisa preencher o form inteiro pra ligar/desligar a IA). No modo de
  criação, um Alert deixa claro que criar o assistant é opcional.
- Testado (screenshots, mocks) criação, edição com dados preenchidos, e
  o toggle ligando/desligando com toast de confirmação — não testado
  contra o backend real rodando (sem ambiente local nesta sessão).

## ✅ Novo em 2026-07-27 — `Lead.assigned_employee_id` agora pode se preencher sozinho

O backend implementou distribuição automática de leads (round-robin,
decisão #15 do `CLAUDE.MD` do backend) — sempre que chega mensagem real
de um Lead sem `assigned_employee_id`, o backend já tenta atribuir
automaticamente pra um funcionário elegível. **Não é campo novo** (`Lead.
assigned_employee_id` já existia em `LeadRead`), só passa a ser
preenchido sozinho às vezes, sem ninguém ter chamado
`PATCH /leads/{id}/assign` manualmente. Não deveria quebrar nada hoje,
mas vale considerar na tela de Leads: um lead já pode chegar com dono
mesmo que o usuário nunca tenha atribuído nada — se a UI tiver algum
indicador tipo "não atribuído" baseado em outra coisa que não seja
`assigned_employee_id === null`, vale conferir.

Importante: isso **não afeta conversas** — `Conversation.
assigned_employee_id` continua exclusivamente manual (via diálogo de
atribuição já existente em `ConversationsPage`), a distribuição
automática nunca mexe nisso.

## O que ainda não existe (não construir UI pra isso ainda)

- Pipeline/Tasks/Notes (Fase 4 do roadmap do backend) — sem rota no
  backend ainda.
- Fechar conversa, import/export em massa — mesma situação, sem
  endpoint no backend.
- Onboarding de WhatsApp self-service (popup da Meta, sem o operador da
  plataforma precisar cadastrar manualmente) — depende do Tech Provider
  existir (CNPJ), ver aviso acima.

## ✅ Construído em 2026-07-31 — gerenciamento de conta (empresa), assinatura e status de funcionário

O item anterior ("planejado em 2026-07-31") ficou desatualizado rápido:
ao reverificar o backend direto no código (não confiar só no que estava
escrito aqui), `GET/PATCH/DELETE /companies/me` **já estavam
implementados e registrados em `main.py`** — só não tinha tela nenhuma
consumindo. Construído:

- **`src/types/company.ts`, `src/services/companyService.ts`,
  `src/hooks/useCompany.ts`, `src/pages/company/CompanyPage.tsx`**
  (rota `/empresa`, permissão `COMPANY/company/VIEW`) — visualização e
  edição dos dados cadastrais (`PATCH /companies/me`: nome, telefone,
  razão social, CNPJ/CPF, site, endereço completo — todos os campos do
  `CompanyUpdate` real do backend, com os mesmos `max_length`).
- **`src/pages/company/CloseAccountDialog.tsx`** — encerramento de conta
  (`DELETE /companies/me`), só visível pro Owner
  (`employee.is_owner`, checado no frontend só pra UX — o backend já
  garante isso via `is_owner` hardcoded no service, então esconder o
  botão não é a única proteção). Exige digitar o **slug** da empresa pra
  habilitar o botão de confirmação (não é um `window.confirm` simples,
  igual usado pra desativar funcionário/lead — a irreversibilidade pelo
  próprio Owner justificava mais fricção). Ao confirmar, chama
  `logout()` direto (o token fica inútil imediatamente — toda chamada
  seguinte já tomaria 403 mesmo).
- **`src/types/subscription.ts`, `src/services/subscriptionService.ts`,
  `src/hooks/useSubscription.ts`, `src/pages/subscription/SubscriptionPage.tsx`**
  (rota `/assinatura`, permissão `SUBSCRIPTION/subscription/VIEW`) —
  mostra plano atual, status, `trial_ends_at`/`current_period_end`
  formatados, e permite trocar de plano (`PATCH /subscription/plan`)
  entre os 3 (Starter/Professional/Enterprise, mesmos nomes do
  `crm-landing`). **Não construído**: qualquer ação de "cancelar
  assinatura" — `cancel_at_period_end` existe no schema mas **nenhum
  endpoint do backend chega a setá-lo como `true`** (nem
  `PATCH /subscription/plan`, nem o webhook do Asaas) — é campo morto
  hoje, então não tem o que acionar pela tela. Status/cancelamento reais
  só mudam via webhook da Asaas (`SUBSCRIPTION_DELETED` →
  `company.status = SUSPENDED`), fora do controle do frontend.
  Enterprise aparece selecionável direto (mesmo endpoint dos outros
  dois) mesmo o `crm-landing` descrevendo esse plano como "sob consulta,
  fale com a gente" no cadastro — não é uma contradição tratada aqui,
  fica registrado como pergunta de produto em aberto (self-service via
  `PATCH` vs. só por contato comercial).
- Ambas as rotas adicionadas em `App.tsx` (`RequirePermission`) e no
  `Sidebar.tsx` (aba Administrativo, ícones `Building2`/`CreditCard`).
- Testado (screenshots, mocks): CompanyPage com dados preenchidos,
  diálogo de encerramento de conta com o botão desabilitado até digitar
  o slug certo, SubscriptionPage com plano/status/renovação, tela de
  Funcionários com os 5 status coloridos, e o seletor de status no
  diálogo de edição — não testado contra o backend real rodando (sem
  ambiente local disponível nesta sessão).

### `EmployeeStatus` estava incompleto — corrigido

`src/types/employee.ts` e `src/types/auth.ts` só tinham
`'ACTIVE' | 'INACTIVE'`, mas o enum real do backend
(`app/shared/enums.py`) tem 5 valores: `ACTIVE`, `INACTIVE`,
`VACATION`, `LEAVE`, `DISABLED`. Não quebrava (TypeScript não valida
valor vindo da API em runtime), mas a tela de Funcionários mostrava
"Inativo" pra qualquer funcionário em férias/afastado/desabilitado —
informação errada, não só falta de detalhe. Corrigido: tipo expandido +
`EMPLOYEE_STATUS_LABEL`, badge de status com cor por valor
(`EmployeesPage.tsx`), e `EditEmployeeDialog.tsx` ganhou um seletor de
Status com os 5 valores (antes só dava pra ativar/desativar via ações
rápidas do menu — que continuam existindo, cobrem o caso comum).
Select fica desabilitado quando `employee.is_owner` (backend rejeita
qualquer status != `ACTIVE` pro Owner via `CannotDeactivateOwnerError`).

### Interação entre status de Employee e status de Company (já em produção, não é mais planejamento)

Confirmado direto no `get_current_employee` (`app/core/dependencies.py`)
que o backend **já** checa os dois, em sequência:
1. `Employee.status != ACTIVE` → `401`, mensagem genérica
   ("Não foi possível validar as credenciais.") — **igual** à de
   token inválido/expirado, não dá pra diferenciar uma coisa da outra
   só pela resposta.
2. Só depois, `Company.status not in (TRIAL, ACTIVE)` → `403`, mensagem
   própria ("Esta empresa está inativa. Entre em contato com o
   suporte.") — **essa sim** é distinguível (status code diferente +
   texto próprio).

`AuthContext.tsx` agora usa essa diferença: guarda `logoutReason`
(string) só quando o logout automático veio de um `403` (empresa
inativa/suspensa), deixa `null` pro `401` genérico (mantém o
comportamento antigo). `LoginPage.tsx` lê `logoutReason` uma vez ao
montar (captura em `useState(() => logoutReason)` porque o context já
limpa em seguida) e mostra como Alert acima do form, só nesse caso
específico — logout manual (botão Sair) ou token expirado continuam sem
esse aviso extra.

## ✅ Corrigido em 2026-07-30 — reconectar WhatsApp depois de "Desconectar" não funcionava

Achado testando o modo manual de conexão de verdade (backend): `DELETE
/whatsapp-instance` não apaga a linha, só marca `status=DISCONNECTED`
(decisão #2 do `CLAUDE.MD` do backend — sem soft delete físico, tudo
por campo de status). Isso por si só está certo e documentado. O
problema era só do lado do frontend: `WhatsAppInstanceService.update`
no backend **só muda `status` se ele vier explícito no payload do
PATCH** — e `UpdateInstanceForm` (`WhatsappPage.tsx`) nunca mandava
esse campo, só `phone_number`/`phone_number_id`/`label`/`credentials`.
Resultado: depois de clicar "Desconectar", não existia **nenhum**
caminho pela UI pra voltar o status a ativo — preencher token novo e
salvar continuava mostrando "Desconectado" pra sempre.

Corrigido: `onSubmit` do `UpdateInstanceForm` agora manda
`status: 'PENDING'` junto sempre que `instance.status === 'DISCONNECTED'`
no momento do submit — salvar (com ou sem trocar o token) já reconecta.
Botão muda de texto pra "Salvar e reconectar" nesse caso, evitando
surpresa (reconectar é um efeito colateral do save, não algo escondido).
Toast também reflete isso ("Instância reconectada" vs "Instância
atualizada"). Testado com `tsc -b` limpo; não testado clicando de
verdade contra o backend nesta sessão.

## ✅ Deploy em produção, 2026-07-29

- **Backend**: `https://pukacrm.duckdns.org` (VM Oracle, modo manual —
  ver decisão arquitetural #16/pendência #2 do `CLAUDE.MD` do backend).
- **Frontend**: `https://puka-crm-web.vercel.app` (Vercel).

**Nenhuma mudança de código foi necessária no frontend** —
`src/services/apiClient.ts` já lê `import.meta.env.VITE_API_URL` com
fallback pro `localhost:8000` (só usado em dev). Pra apontar o build de
produção pro backend real, o único passo é configuração, direto no
painel da Vercel:

- **Project Settings → Environment Variables** → adicionar
  `VITE_API_URL=https://pukacrm.duckdns.org` (ambiente Production) →
  **redeploy** (Vite injeta essa variável em build time, não em
  runtime — mudar a env var sem redeploy não tem efeito nenhum).

**Do lado do backend** (não é trabalho deste repositório, só registro
pra contexto): `CORS_ORIGINS` no `.env` da VM precisa incluir
`https://puka-crm-web.vercel.app`, senão o navegador bloqueia as
chamadas por CORS mesmo com `VITE_API_URL` certo. Sem isso configurado,
o sintoma no frontend é toda chamada da `api` falhando com erro de
rede/CORS no console, não um erro de negócio normal.

**✅ Validado em 2026-07-29**: primeiro deploy subiu sem a env var
`VITE_API_URL` configurada na Vercel — o bundle de produção caiu no
fallback `http://localhost:8000` (visível inspecionando o JS: nenhuma
ocorrência de `pukacrm`, uma de `localhost:8000`). Corrigido configurando
a env var em Production e refazendo o deploy sem cache; confirmado no
bundle novo que `baseURL` já resolve pro backend real.

**Pegadinha da Vercel, já causou confusão uma vez**: cada deployment
ganha uma URL própria com hash tipo
`puka-crm-<hash>-<team>.vercel.app` (é o link que aparece em "Visit" na
página do deployment) — **diferente** do domínio de produção
`https://puka-crm-web.vercel.app`. O backend só libera esse último no
`CORS_ORIGINS`, então testar pela URL com hash dá erro de CORS no
console mesmo com tudo certo. Login testado e confirmado funcionando em
`https://puka-crm-web.vercel.app`.

## Comandos úteis

```bash
npm install
npm run dev
# .env.local precisa de VITE_API_URL apontando pro crm-backend
```
