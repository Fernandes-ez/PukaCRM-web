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
Assinatura (ver plano + trocar de plano), Notificações em tempo real
(sino na topbar, ver seção 2026-08-06 abaixo). Camada de `services/`
espelhando 1:1 os módulos do backend (`employeeService`, `roleService`,
`leadService`, `conversationService`, `assistantService`,
`whatsappInstanceService`, `workScheduleService`, `companyService`,
`subscriptionService`, `notificationService`).

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

## ✅ Novo em 2026-08-05 — tela de Cobranças (histórico de pagamentos do Asaas)

`SubscriptionPage.tsx` ganhou um card **"Cobranças"** abaixo do card de
troca de plano, consumindo o endpoint novo `GET /subscription/charges`
(proxy ao vivo pro Asaas — backend não duplica isso numa tabela local,
ver `CLAUDE.MD` do backend). Cada linha mostra valor, status (badge:
Paga/Pendente/Vencida/Estornada/Outro), vencimento, forma de pagamento,
data de pagamento (se paga), e um botão **"Ver cobrança"** que abre
`invoice_url` (página hospedada pelo próprio Asaas) numa aba nova —
funciona igual pra boleto/PIX/cartão, não precisa diferenciar o tipo no
frontend. Estado vazio ("Nenhuma cobrança ainda") pra empresas em
`TRIALING` sem histórico. Lista ordenada por vencimento mais recente
primeiro (`compareDatesDesc`, já existia em `utils/date.ts`).

Sem ação de criar cobrança avulsa nessa v1 — fora de escopo (fica pra
quando existir venda avulsa da IA, decisão #14 do `CLAUDE.MD` do
backend). `types/subscription.ts` ganhou `Charge`/`ChargeStatus`/
`CHARGE_STATUS_LABEL`; `subscriptionService.listCharges()` +
`useCharges()` seguem o mesmo padrão de `get()`/`useSubscription()`
já existentes. Testado com `tsc -b` limpo; não testado clicando de
verdade contra o backend nesta sessão.

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

## ✅ Corrigido em 2026-08-04 — mensagens de conversa apareciam todas do mesmo lado/cor

Reportado com print de produção: no detalhe de uma conversa, a mensagem
recebida do Lead e a enviada pela empresa apareciam **as duas do lado
direito, roxas** — indistinguíveis. Causa: mesmo padrão de drift já visto
em outros módulos (Assistente, WhatsApp) — o tipo `Message` do frontend
usava um campo/enum que nunca existiu no backend real:

- Frontend tinha `sender: 'LEAD' | 'EMPLOYEE' | 'ASSISTANT'`. Backend
  (`MessageRead` em `app/modules/message/schemas.py`) na verdade manda
  `sender_type: 'LEAD' | 'AI' | 'EMPLOYEE'` — nome de campo diferente
  (`sender_type`, não `sender`) **e** valor diferente pro terceiro caso
  (`AI`, não `ASSISTANT`). Como `message.sender` nunca vinha preenchido
  (o campo real se chama `sender_type`), a comparação
  `message.sender === 'LEAD'` em `ConversationDetail.tsx` dava sempre
  `false` — toda mensagem, de quem fosse, caía no branch "enviada por
  nós" (right-aligned, cor primária).
- `src/types/conversation.ts` corrigido pro schema real: `sender_type`
  no lugar de `sender`, enum com `AI` no lugar de `ASSISTANT`, e dois
  campos que nem existiam no tipo (`sender_employee_id`,
  `external_message_id` — não usados na UI ainda, só documentados no
  tipo pra não esquecer que existem).
- `ConversationDetail.tsx` — todas as comparações trocadas pra
  `message.sender_type`. Mensagens `AI` continuam do lado direito (é
  "nós" do ponto de vista do Lead), mas ganharam uma etiqueta discreta
  com ícone de robô + "IA" ao lado do horário, pra diferenciar de uma
  resposta digitada por um humano — informação que o campo já trazia e
  não tinha nenhum uso ainda.
- Testado (screenshot, mock com as 3 combinações de `sender_type`):
  Lead à esquerda em cinza, funcionário e IA à direita em roxo, com a
  etiqueta "IA" só na mensagem da assistente — não testado contra o
  backend real rodando (sem ambiente local disponível nesta sessão).

## ✅ Corrigido em 2026-08-04 — diálogo de atribuição de conversa ficava com estado velho

Reportado pelo usuário ("como a IA não atribuiu, como prosseguir"), e ao
investigar a exibição da atribuição achado um bug separado: em
`ConversationDetail.tsx`, `<AssignConversationDialog>` era renderizado
**sempre montado** (só `open`/`onOpenChange` controlando visibilidade) —
diferente do padrão usado em todo o resto do app (`EditLeadDialog`,
`AssignLeadDialog`, `EditEmployeeDialog`, todos condicionados por
`{estado && <Dialog ... />}`). Como o `useState(conversation.
assigned_employee_id ?? '')` dentro do diálogo só roda na primeira
montagem, e o componente nunca desmontava (nem trocando de conversa na
lista, nem depois de atribuir), o dropdown podia pré-selecionar o
responsável **de outra conversa** ou um valor velho — risco real de
atribuir a pessoa errada sem perceber. Corrigido: `ConversationDetail.tsx`
agora só monta o diálogo quando `assignOpen` é `true`
(`{assignOpen && <AssignConversationDialog .../>}`), forçando remontagem
(e reseed do estado) a cada abertura.

Nada relacionado a round-robin: distribuição automática **nunca** cobriu
`Conversation.assigned_employee_id`, só `Lead.assigned_employee_id`
(decisão #15 do `CLAUDE.MD` do backend, 2026-07-27) — atribuição de
conversa sempre foi manual, por design.

## ✅ Corrigido em 2026-08-04 — `Lead` com campos que nunca existiram no backend real

Reportado com a resposta real de `GET /leads` colada pelo usuário: a
tela de Leads mostrava nome em branco, o selo de status sem nenhum texto
(só a forma colorida), e "Não atribuído" mesmo pra um lead com
`assigned_employee_id` preenchido. Comparando com o schema real
(`app/modules/lead/schemas.py` do backend), o tipo `Lead` do frontend
tinha 3 problemas, todos do mesmo tipo de drift já visto em outros
módulos (schema escrito sem acesso ao backend rodando):

- **Campo errado**: frontend tinha `name: string` (obrigatório); o
  backend é `full_name: str | None` — **opcional e pode vir `null`**
  (lead que chega só com telefone via WhatsApp antes de dar o nome, daí
  o "Lead sem nome" que já aparecia em Conversas). `name` nunca existiu
  no JSON de resposta, então `{lead.name}` sempre renderizava `undefined`
  → célula em branco.
- **Enum errado**: frontend tinha `LeadStatus = 'NEW' | 'IN_PROGRESS' |
  'QUALIFIED' | 'LOST' | 'ARCHIVED'` — um funil de vendas que nunca foi
  implementado. O real (`app/shared/enums.py`) é só
  `'ACTIVE' | 'INACTIVE'` (o mesmo padrão simples de soft-delete usado em
  `WhatsAppInstance`/`Assistant` — `DELETE /leads/{id}` só arquiva,
  `LeadStatus.INACTIVE`, não apaga). Como `"ACTIVE"` não batia com
  nenhuma chave do `Record<LeadStatus, ...>` do frontend, o `Badge`
  renderizava sem variante nem texto — só a forma cortada do componente,
  sem cor nem label (era exatamente a "forminha rosa sem texto" da
  imagem reportada).
- **Campo que nunca existiu**: frontend tinha `assigned_employee_name`
  no tipo `Lead`, mas `LeadRead` no backend **não faz join com
  Employee** — só devolve `assigned_employee_id` (confirmado lendo
  `schemas.py`). Por isso a coluna "Responsável" sempre mostrava "Não
  atribuído", mesmo com o lead de fato atribuído (`assigned_employee_id`
  preenchido, visível no `GET /leads` cru). Corrigido resolvendo o nome
  no cliente: `LeadsPage.tsx` agora busca `useEmployees()` e monta um
  `Map<id, full_name>` (mesmo padrão já usado pra Cargo em
  `EmployeesPage.tsx`), em vez de esperar um campo que o backend nunca
  vai mandar.

Corrigido em `src/types/lead.ts` (schema real), `LeadsPage.tsx`
(`statusVariant`/`LEAD_STATUS_LABEL` pros 2 valores reais, resolução de
responsável via `useEmployees()`), `CreateLeadDialog.tsx`/
`EditLeadDialog.tsx` (`name`→`full_name`, agora opcional na criação,
`status` com os 2 valores reais), `AssignLeadDialog.tsx` e
`DashboardPage.tsx` (mesma correção de campo no card "Últimos leads"),
e `utils/leadAnalytics.ts` (o anel de cores do dashboard supunha 5
categorias que nunca existiram — reduzido pra 2, reaproveitando duas das
cores já validadas CVD do conjunto original em vez de invalidar a
paleta). Testado (screenshot) com o payload real colado pelo usuário —
nome, status e responsável todos corretos.

**✅ Corrigido, mesmo dia**: `ConversationRead` no backend
(`app/modules/conversation/schemas.py`) tinha exatamente o mesmo
problema — **não tem** `lead_name`, `assigned_employee_name` nem
`updated_at`, só `lead_id`/`assigned_employee_id` (ids crus) e
`created_at`. Era a causa raiz do "Lead sem nome" que aparecia sempre na
tela de Conversas, mesmo quando o lead tem nome — não era o lead que não
tinha nome, era o campo que nunca chegava. Corrigido: `types/
conversation.ts` (`ConversationRead` sem os 3 campos fantasmas, ganhou
`whatsapp_instance_id` que existe de verdade) e nome de lead/responsável
resolvidos no cliente cruzando `lead_id`/`assigned_employee_id` com
`useLeads()`/`useEmployees()` (mesmo padrão do fix de `LeadsPage.tsx`
acima) em `ConversationsPage.tsx`, `ConversationDetail.tsx`,
`AssignConversationDialog.tsx` e no card "Conversas que precisam de
atenção" do `DashboardPage.tsx`. Fallback de ordenação trocado de
`a.updated_at` (não existe) pra `a.created_at` em `ConversationsPage.tsx`.
Testado (screenshot, mock com o formato real de `ConversationRead`/
`LeadRead`) — nome do lead e do responsável aparecendo certos na lista,
no detalhe, no diálogo de atribuição e no dashboard.

## ✅ Corrigido em 2026-08-05 — auditoria de UI/UX e acessibilidade

Reportado pelo usuário, uma lista de 6 pontos. Resultado, item por item:

1. **✅ Corrigido — contraste da bolha de mensagem da IA/funcionário.**
   Calculado manualmente (fórmula de luminância relativa do WCAG): o
   texto normal da bolha (`bg-primary text-primary-foreground`, tema
   escuro) já passava (~5.4:1), mas o horário/etiqueta "IA" usava
   `opacity-70` por cima disso — a mistura com o fundo magenta derrubava
   o contraste efetivo pra ~3.4:1, abaixo do mínimo de 4.5:1 do WCAG AA.
   `ConversationDetail.tsx`: `opacity-70` → `opacity-90` nesse texto
   (~4.8:1 calculado, dentro do padrão). Validado visualmente depois.
2. **Textos secundários no tema escuro**: recalculado o contraste de
   `--muted-foreground` (dark) contra `--background`/`--card` e de
   `text-sidebar-foreground/55`/`/65` (usado na aba "Administrativo"
   inativa e itens de menu) contra `--sidebar` (dark) — todos deram
   entre 5.3:1 e 7.2:1 nas minhas contas, já dentro do AA. Não mexi
   nessas cores pra não alterar a paleta de marca (já validada CVD) sem
   um problema comprovado — se ainda parecer apagado na prática (poder
   ser percepção subjetiva de tela/iluminação, não é incomum divergir
   um pouco do cálculo), apontar o elemento exato que quer mais claro
   pra eu recalcular em cima dele específico.
3. **Não é bug — decisão de marca já registrada**: `index.css` comenta
   explicitamente "Sidebar sempre roxo-escuro — identidade de marca,
   independente do tema". Intencional, não alterna com o tema claro/
   escuro do resto da aplicação. Avisar se quiser reabrir essa decisão.
4. **✅ Corrigido — anel de foco fraco demais.** Confirmado: quase todo
   componente interativo (`button`, `input`, `textarea`, `select`,
   `switch`, `checkbox`, `tabs`) usava `focus-visible:ring-ring/50` (só
   50% de opacidade) e a maioria sem `ring-offset` nenhum — só o botão
   de fechar diálogo já usava o padrão mais forte
   (`ring-ring` cheio + `ring-offset-2`). Padronizado esse padrão mais
   visível nos 7 componentes acima (`src/components/ui/`). Itens de menu
   dropdown/select (`focus:bg-accent`, roving focus por seta) não
   mudaram — já têm contraste de fundo suficiente e não é o mesmo padrão
   de navegação por Tab.
5. **Não reproduzido**: tentei recriar a "aberração cromática" no número
   do card "Conversas aguardando atenção" — testei com/sem
   `needs_human_attention` (troca a cor do ícone e o glow do hover) e
   com/sem hover, `deviceScaleFactor: 2`, várias combinações — o número
   sempre renderizou sólido, sem fringing, nos meus screenshots. Hipótese
   mais provável: artefato de compressão JPEG (chroma subsampling cria
   franjas vermelho/azul em texto branco nítido sobre fundo escuro
   quando a imagem é salva/comprimida como JPEG — muito comum em
   screenshots) ou um frame capturado no meio da transição de hover
   (`drop-shadow` + `translate` animando junto). Se continuar aparecendo
   de forma consistente (não só em prints comprimidos), útil mandar o
   arquivo de imagem original (PNG, sem recompressão) e/ou gravar em
   qual navegador/zoom pra eu tentar de novo com esses parâmetros.
6. **Não avaliado a fundo**: indicação de campo obrigatório e anúncio
   acessível de erro de validação. Os forms usam React Hook Form + Zod
   com mensagem de erro visível abaixo do campo (`<p
   className="text-destructive">`), mas nenhum usa `aria-required` nem
   asterisco visual, e as mensagens de erro não têm `role="alert"`/
   `aria-live` pra leitor de tela anunciar automaticamente. Fora desta
   entrega — é mudança em muitos formulários (Funcionário, Cargo, Lead,
   Assistente, WhatsApp, Empresa...), melhor tratar como item à parte se
   for prioridade agora.

## ✅ Corrigido em 2026-08-05 — `window.confirm()` nativo (sem estilização) em 5 lugares

Reportado com print (desativar funcionário mostrando o dialog cinza
padrão do navegador, "puka-crm-web.vercel.app diz"). Já tinha sido
corrigido caso a caso antes (troca de plano na Assinatura, encerrar
conta), mas ainda restavam 5 `window.confirm()` espalhados: arquivar
lead (`LeadsPage.tsx`), excluir cargo (`RolesPage.tsx`), desativar
funcionário (`EmployeesPage.tsx`), e gerar nova chave de API / desconectar
(`WhatsappPage.tsx`, os dois no mesmo arquivo). Criado
`src/components/ui/confirm-dialog.tsx` — `ConfirmDialog` genérico
(title/description/confirmLabel/variant/isPending/onConfirm) reaproveitando
`Dialog` — e trocado nos 5 lugares por um estado (`useState<T | null>`
guardando o item pendente, ou `useState<boolean>` nos dois casos do
WhatsApp que não têm item associado) em vez do `if (!window.confirm(...))
return` síncrono. Confirmado por grep que não sobra nenhum
`window.confirm`/`alert`/`prompt` no `src/`. Testado (screenshot) o caso
exato do print reportado (desativar funcionário) — mesmo texto, agora
com o visual do site.

## ✅ Novo em 2026-08-06 — sino de notificações em tempo real

Pedido do usuário: alertar o atendente quando surge um lead novo
atribuído a ele, ou uma conversa que precisa de atenção. Backend novo
(`GET/PATCH /notifications*` + `GET /ws/notifications`, ver `CLAUDE.md`
do backend, decisão #18) consumido do zero:

- **`src/types/notification.ts`, `src/services/notificationService.ts`,
  `src/hooks/useNotifications.ts`** — mesmo padrão de types/service/hooks
  já usado em todo o resto do app. `useNotifications()`/`useUnreadCount()`
  (REST, `enabled: isAuthenticated`), `useMarkNotificationRead()`/
  `useMarkAllNotificationsRead()` (mutations, invalidam as duas queries).
- **`useNotificationSocket()`** — hook à parte, sem `useQuery`: abre um
  `WebSocket` puro (não é REST, TanStack Query não serve pra isso) contra
  `/ws/notifications?token=<jwt>` (**mesmo token** do `localStorage`,
  `getStoredToken()` — não existe endpoint separado pra gerar token de
  socket). Cada mensagem recebida é escrita **direto no cache do
  react-query** via `queryClient.setQueryData` nas mesmas chaves de
  `useNotifications`/`useUnreadCount` — não existe um estado de
  notificações separado, o cache é a única fonte da verdade, então o
  sino sempre reflete o que chegou em tempo real sem precisar de
  refetch. Reconecta sozinho com backoff (1s/2s/5s/10s/30s) se a conexão
  cair; também mostra um toast (`useToast`) a cada notificação nova.
  **Montado uma única vez em `AppLayout.tsx`** (não dentro do
  `NotificationBell`) — de propósito, pra abrir/fechar o dropdown não
  reconectar o socket.
- **`src/modules/layout/NotificationBell.tsx`** — sino na `Topbar`, badge
  com contador (`9+` acima de 9), dropdown com a lista (ícone diferente
  por `type`, item não lido em destaque com ponto roxo). Clicar num item
  marca como lido e navega: `related_conversation_id` → `/conversations/
{id}` (rota já existe); `related_lead_id` → `/leads` (lista simples, não
  existe rota de detalhe de lead ainda, então não dá pra linkar direto
  pro lead específico).
- `API_URL` (`http(s)://...`) é convertido pra `ws(s)://...` só trocando
  o prefixo (`API_URL.replace(/^http/, 'ws')`) — mesma env var
  `VITE_API_URL` já usada pro resto da API, não precisa de config nova.
- Testado localmente com `tsc -b` + `npm run build` limpos — não testado
  contra o WebSocket real do backend rodando nesta sessão (sem ambiente
  local disponível). **Em produção, depende do ajuste de Nginx
  documentado em `docs/deploy-oracle-vm.md` do backend** — sem os
  headers de `Upgrade`/`Connection`, o handshake do WebSocket falha
  atrás do reverse proxy mesmo com o resto funcionando.

## ✅ Novo em 2026-08-07 — player de áudio nas mensagens de voz do WhatsApp

Backend passou a processar mensagens de voz (antes eram silenciosamente
ignoradas, ver `CLAUDE.md` do backend, decisão #19). Consumido:

- **`src/types/conversation.ts`** — `Message` ganha `content_type`
  (`'TEXT' | 'AUDIO'`) e `external_media_id`. Quando `content_type ===
  'AUDIO'`, `content` é a transcrição (gerada pelo n8n/Gemini) ou, até
  ser transcrita (ou se a empresa não tem IA ativa), um placeholder
  fixo ("🎤 Mensagem de áudio") que o próprio backend grava.
- **`src/pages/conversations/AudioMessagePlayer.tsx`** (novo) — busca o
  áudio **sob demanda** (só ao clicar em "Ouvir áudio", não pré-carrega
  toda mensagem de uma conversa longa) via
  `conversationService.getAudio()` (`api.get(..., { responseType:
  'blob' })` — primeiro uso de blob/binário via axios neste repo),
  converte com `URL.createObjectURL` e troca o botão por um
  `<audio controls autoPlay>`; `URL.revokeObjectURL` no unmount. **De
  propósito não é um `<audio src="...">` direto** apontando pro
  endpoint do backend: a Meta exige o `access_token` até pra baixar o
  arquivo, e uma tag HTML nativa não manda header `Authorization`
  customizado — teria que expor o token na URL (padrão mais fraco, fica
  em log/histórico do navegador) pra contornar isso. Buscar via `axios` (que já
  anexa o Bearer normal) evita esse problema, diferente do
  `/ws/notifications` (que usa token na URL só porque o WebSocket do
  navegador força isso, sem alternativa).
- Botão usa `border-current`/`bg-current` (opacidade via Tailwind v4)
  em vez de uma cor fixa — se adapta sozinho tanto à bolha clara do
  Lead quanto à escura da IA/funcionário, sem precisar de uma prop de
  variante nem duplicar estilo.
- **`ConversationDetail.tsx`** — bolha de mensagem ganhou uma checagem
  `message.content_type === 'AUDIO'` que renderiza o player acima do
  texto (que continua sendo a transcrição/placeholder) — mesmo padrão
  já usado ali pra badge "IA" (`sender_type === 'AI'`).
- **Não construído nesta entrega**: nenhuma indicação de duração do
  áudio antes de tocar (a Meta não manda isso no webhook, só o
  `media_id` — teria que baixar o arquivo só pra descobrir a duração, o
  que anularia a vantagem de buscar sob demanda).
- Testado com `tsc -b` + `npm run build` limpos; não testado tocando um
  áudio de verdade nesta sessão (sem ambiente local/n8n disponível) —
  o botão "Ouvir áudio"/estado de erro foi verificado só por leitura de
  código, não clicando de fato contra o backend rodando.

## ✅ Novo em 2026-08-07 — botão "Devolver pra IA" na tela de Conversas

Achado testando a feature de áudio: uma conversa atribuída a um humano
não tinha como voltar pra IA (só existia `/assign`, nunca um
"desatribuir"). Consumido o `POST /conversations/{id}/unassign` novo do
backend (ver `CLAUDE.md` do backend, decisão #20):

- `conversationService.unassign()` + `useUnassignConversation()`, mesmo
  padrão de `assign()`/`useAssignConversation()` já existentes.
- Botão "Devolver pra IA" no cabeçalho de `ConversationDetail.tsx`, só
  aparece quando `conversation.assigned_employee_id` já está
  preenchido. Confirma antes com `ConfirmDialog`
  (`src/components/ui/confirm-dialog.tsx` — já existia no projeto de
  uma limpeza anterior de `window.confirm()`, primeira vez que uso
  nesta tela), deixando claro no texto que **não gera resposta
  retroativa da IA** — só vale a partir da próxima mensagem que o Lead
  mandar.
- Testado com `tsc -b` + `npm run build` limpos; não clicado de verdade
  contra o backend rodando nesta sessão.

## ✅ Novo em 2026-08-07 — Fase 4: Pipeline (Kanban), Tarefas e Observações

Consumido o novo backend de CRM (ver `CLAUDE.md` do backend, decisão
#21). Nova rota `/pipeline` (`RequirePermission module="PIPELINE"
resource="pipeline" action="VIEW"`, item novo no `Sidebar.tsx` ao lado
de "Leads", sem gate de permissão na aba do menu — mesmo padrão de
Leads/Conversas, que também não são gated na sidebar mesmo a rota
sendo protegida).

- **`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`**
  (novas dependências) — não existia nenhuma lib de drag-and-drop no
  projeto. Escolhida por compatibilidade real com React 19 (diferente
  de `react-beautiful-dnd`, que tem problemas conhecidos com
  `findDOMNode`/legacy context nessa versão do React).
- **`src/pages/pipeline/PipelinePage.tsx`** — quadro Kanban: colunas =
  `PipelineStage` (+ coluna extra "Sem estágio" só como origem de
  drag, nunca destino, pra leads criados antes da Fase 4 existir — sem
  migração de backfill), cards = `Lead`. Usa `useDraggable`/
  `useDroppable` do `@dnd-kit/core` direto (não o `SortableContext` do
  pacote `sortable`, que é pra reordenar dentro de uma única lista —
  aqui o card muda de container, é o padrão "multiple containers" da
  doc do dnd-kit).
- **`useMoveLeadStage()`** (`src/hooks/useLeads.ts`) — **primeira
  atualização otimista do projeto** (`onMutate`/`onError`/`onSettled`
  do TanStack Query). Todos os outros hooks de mutação só invalidam e
  esperam o refetch; aqui isso deixaria o card "voltando" pra coluna
  antiga por um instante a cada drag, então o cache é atualizado na
  hora e só desfeito se o `PATCH /leads/{id}/move-stage` falhar de
  verdade.
- **`PipelineStagesDialog.tsx`** — configurar estágios (criar/excluir/
  reordenar), só visível com `PIPELINE/pipeline/MANAGE`. Reordenar usa
  `@dnd-kit/sortable` (`SortableContext` + `useSortable`) — esse sim é
  o caso de uso "certo" pro pacote sortable, uma lista vertical única.
- **`LeadDetailDialog.tsx`** (novo — não existia uma tela de detalhe
  de Lead separada da tabela) — abre ao clicar num card do Kanban,
  com abas **Tarefas** (criar/marcar concluída via `Checkbox`/excluir,
  mostra responsável resolvido via `useEmployees()` e destaca vencidas
  em vermelho) e **Observações** (criar/listar/excluir, sem edição —
  reflete o backend, que não tem `PATCH /notes/{id}`).
- **`NotificationBell.tsx`** ganha ícones pros 2 tipos novos
  (`TASK_ASSIGNED`/`TASK_DUE`) e navega pra `/pipeline` ao clicar numa
  notificação de tarefa (não existe deep-link pra abrir o
  `LeadDetailDialog` de um lead específico direto da notificação —
  fica só na página, o usuário encontra o card manualmente por
  enquanto).
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. **Não
  testado visualmente num navegador** nesta sessão (sem ferramenta de
  automação de navegador disponível) — o drag-and-drop, os dialogs e o
  fluxo completo (criar tarefa, marcar concluída, arrastar card entre
  colunas) não foram clicados de verdade contra o backend rodando.
  Validar manualmente antes de considerar essa tela pronta pra uso
  real.

## ✅ Novo em 2026-08-07 — Fechar conversa, import/export de Leads e distribuição automática

Consumido o backend (ver `CLAUDE.MD` do backend, decisão #22) — 4 itens
que ficaram pra trás desde fases anteriores, revisados junto com o
usuário. Um 5º item cogitado (`transfer_rules`) não gerou nenhuma
mudança aqui — investigado no backend e confirmado que já funcionava
desde a Fase 2.

- **Fechar conversa** — `conversationService.close()` +
  `useCloseConversation()`, mesmo padrão de `unassign()` (seção acima).
  Botão "Fechar conversa" no cabeçalho de `ConversationDetail.tsx`
  (some quando `status === 'CLOSED'`), confirmado via `ConfirmDialog`.
  Quando fechada, o formulário de resposta dá lugar a uma mensagem de
  placeholder — não existe "reabrir" no frontend porque não existe no
  backend: a próxima mensagem do Lead já nasce numa conversa nova
  sozinha.
- **Import/export de Leads** (`LeadsPage.tsx`) — botões "Exportar"/
  "Importar", cada um só visível com a permissão correspondente
  (`hasPermission('LEADS', 'lead', 'EXPORT'/'IMPORT')`).
  `leadService.exportCsv()` busca o CSV como blob e dispara download via
  um `<a>` temporário (`URL.createObjectURL`); `importCsv(file)` sobe
  `multipart/form-data` por um `<input type="file" accept=".csv">`
  escondido, acionado pelo botão visível. Resultado do import
  (`created`/`skipped`, com motivo da primeira linha ignorada) mostrado
  num toast — sem dialog de revisão linha a linha.
- **Distribuição automática por inatividade** — `Company`/
  `CompanyUpdateRequest` ganharam `auto_redistribution_enabled`/
  `redistribution_after_days`. Nova seção "Distribuição automática" em
  `CompanyPage.tsx`: um `Switch` que salva na hora ao alternar (PATCH
  imediato, sem botão "Salvar" separado) + um campo de dias com botão
  "Salvar" próprio — isolado do formulário grande de dados da empresa
  (react-hook-form), mesmo raciocínio de "patch pequeno e imediato" já
  usado em outras telas de configuração pontual.
- **Auto-atribuição de Conversation** — mudança só de comportamento do
  backend (`Conversation.assigned_employee_id` agora pode se preencher
  sozinho quando a IA sinaliza necessidade de humano, não só quando
  atribuído manualmente ou herdado do Lead) — nenhuma tela nova aqui,
  mas explica por que uma conversa pode aparecer com responsável mesmo
  sem ninguém ter clicado em "Atribuir": o sino de notificações
  (`NotificationBell.tsx`) já cobre esse caso, já que
  `CONVERSATION_NEEDS_ATTENTION` sempre teve ícone/rota prontos.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. **Não
  testado visualmente num navegador** nesta sessão — validar os 3
  fluxos de UI (fechar conversa, exportar/importar CSV, toggle de
  distribuição automática) manualmente antes de considerar prontos pra
  uso real.

## ✅ Novo em 2026-08-07 — Export de Leads em .xlsx, além de .csv

Consumido o `format` novo do `GET /leads/export` (ver `CLAUDE.MD` do
backend, decisão #23) — usuário achou o CSV "feio" e pediu pra
estilizar; CSV não carrega formatação de verdade (cor, negrito), então
a resposta foi oferecer `.xlsx` estilizado como opção nova, mantendo o
`.csv` (agora com o bug de acento/emoji corrompido corrigido no
backend) como o outro.

- `leadService.exportCsv()` virou `exportLeads(format: 'csv' | 'xlsx')`
  — manda `?format=` na query. `useExportLeads()` recebe o formato
  como argumento do `mutateAsync`.
- **Botão "Exportar" virou `DropdownMenu`** (`LeadsPage.tsx`), com
  "Excel (.xlsx)" e "CSV (.csv)" — mesmo gate de permissão de antes
  (`LEADS/lead/EXPORT`), só a UI do botão único mudou pra dropdown com
  as duas opções. Nome do arquivo baixado usa a extensão certa
  (`leads.xlsx`/`leads.csv`) conforme a escolha.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-07 — Modelo de import, mensagem de encerramento e fechamento automático de Conversation

Consumido o backend (ver `CLAUDE.MD` do backend, decisão #24). Pesquisa
na doc da Meta feita antes de implementar mostrou que mensagem de texto
livre só sai dentro da janela de atendimento de 24h do Lead — isso não
muda nada na tela em si, mas é por isso que o backend limita o
fechamento automático a 24h (ver decisão).

- **`LeadsPage.tsx`** — botão "Importar" virou `DropdownMenu`:
  "Escolher arquivo (.csv ou .xlsx)" (mesmo file picker de antes, só
  que `accept=".csv,.xlsx"` agora) + "Baixar modelo (.xlsx)"/"Baixar
  modelo (.csv)", que baixam `GET /leads/import/template` via
  `leadService.downloadImportTemplate(format)`/
  `useDownloadImportTemplate()`. `leadService.importCsv` renomeado pra
  `importLeads` (deixou de ser só CSV).
- **`CompanyPage.tsx`** — novo card "Mensagem de encerramento"
  (`Textarea` + botão "Salvar" isolado, mesmo padrão de patch pequeno e
  imediato já usado no card de distribuição automática) — edita
  `Company.closing_message` via `PATCH /companies/me`.
  `Company`/`CompanyUpdateRequest` ganharam o campo.
- **`ConversationDetail.tsx`** — mensagens com `sender_type: 'SYSTEM'`
  (a mensagem de encerramento) não entram mais na bolha de chat
  esquerda/direita — aparecem centralizadas, num pill discreto, mesmo
  padrão visual de "aviso do sistema" usado por apps de chat em geral.
  `MessageSenderType` (`types/conversation.ts`) ganhou o valor `SYSTEM`.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-07 — Iniciar conversa via Message Template

Consumido o backend (ver `CLAUDE.MD` do backend, decisão #25) — usuário
perguntou se dava pra iniciar conversa com Lead fora da janela de 24h da
Meta sem virar Tech Provider; a resposta foi sim, e a entrega ficou desse
tamanho: gerenciar templates + iniciar conversa manualmente, 1 Lead por
vez (campanha em massa fica pro roadmap).

- **`WhatsappPage.tsx`** — campo `WABA ID` novo nos formulários de
  criar/editar instância (opcional, só necessário pra templates), ao
  lado do Phone Number ID já existente. Ganhou também um card com link
  "Gerenciar" pra `/whatsapp/templates`.
- **`MessageTemplatesPage.tsx`** (novo, `pages/whatsapp/`, rota própria
  `/whatsapp/templates`, item novo "Templates" na Sidebar ao lado de
  "WhatsApp") — **Atualizado em 2026-08-07**: nasceu como um card dentro
  de `WhatsappPage.tsx`, mas o usuário achou melhor página própria (fica
  esquisito squeeze-ado dentro da tela de conexão) - virou página
  separada, gated pela própria `RequirePermission` de rota
  (`WHATSAPP/message_template/VIEW`), mesmo padrão das outras páginas
  administrativas. Lista de templates com badge de status (`Em
  análise`/`Aprovado`/`Rejeitado`/`Pausado`/`Desativado`, mostra o
  motivo quando rejeitado) + dialog "Novo template" (nome, categoria,
  idioma - default `pt_BR`, corpo com `{{1}}`/`{{2}}`, rodapé opcional)
  + exclusão com confirmação. Gates de permissão
  (`WHATSAPP/message_template` `VIEW`/`CREATE`/`DELETE`) igual ao resto
  do projeto.
  - **Achado testando em produção**: o card não aparecia pra nenhuma
    empresa já existente (inclusive a piloto) mesmo o Owner tendo
    "todas as permissões" - a permissão nova (`message_template`) só é
    vinculada automaticamente ao Owner de empresas **criadas depois**
    dela existir no catálogo (decisão #5 do `CLAUDE.MD` do backend, já
    documentada, mas na prática nunca tinha mordido até agora). Fix é
    do lado do backend: `scripts/sync_owner_permissions.py`, novo -
    rodar sempre que uma permissão nova for adicionada ao catálogo.
- **`StartConversationDialog.tsx`** (novo, `pages/leads/`) — aberto pelo
  item "Iniciar conversa" no menu de ações do `LeadsPage.tsx` (gated por
  `CONVERSATIONS/conversation/CREATE`). Só lista templates `APPROVED`;
  ao escolher um, gera 1 campo de texto por variável posicional
  (`body_variable_count`) com pré-visualização ao vivo do texto
  renderizado. Ao enviar, navega pra `/conversations/{id}` da conversa
  criada.
- `MessageTemplate`/`MessageTemplateCreateRequest`
  (`types/messageTemplate.ts`), `messageTemplateService.ts`,
  `useMessageTemplates.ts` — CRUD padrão, mesmo formato de outros
  módulos simples (`note`). `leadService.startConversation` +
  `useStartConversation` novos em `leadService.ts`/`useLeads.ts`.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-10 — grupos expansíveis na Sidebar (WhatsApp: Conexão + Templates)

Usuário achou estranho "WhatsApp" e "Templates" como dois itens soltos
lado a lado na sidebar - pediu um "alternante" que abre com as
sub-páginas dentro. Confirmado com o usuário: padrão genérico e
reutilizável (não só um hack pro WhatsApp), pra qualquer seção
administrativa futura com múltiplas páginas usar sem duplicar código.

- **`Sidebar.tsx`** — `allAdminItems` (antes `AdminNavItem[]` plano)
  virou `AdminNavEntry[]`, união de `AdminLeafItem` (item de sempre,
  com `to`) e `AdminGroupItem` (`label`/`icon`/`children:
  AdminLeafItem[]`, sem `to` próprio - não é navegável, só expande/
  colapsa). "WhatsApp" é o primeiro grupo: `children` = "Conexão"
  (`/whatsapp`) + "Templates" (`/whatsapp/templates`).
  `flattenAdminItems` achata grupos em sub-itens - reaproveitado por
  `isAdminPath` (decidir aba Geral/Administrativo) sem duplicar a
  lógica de percurso.
  - Filtragem por permissão: `adminItems` (`useMemo`) filtra cada
    `child` individualmente e só mantém o grupo se sobrar pelo menos 1
    filho permitido - cargo com permissão só de `message_template` (não
    `whatsapp_instance`) vê o grupo "WhatsApp" com só "Templates" dentro.
  - Grupo expandido/colapsado é estado local (`expandedGroups`, um
    `Set<string>` por `label`) - **auto-expande** quando a rota atual
    bate com algum filho (efeito reagindo a `location.pathname`, mesmo
    raciocínio já usado pra trocar a aba Geral/Administrativo
    sozinha), então navegar direto pra `/whatsapp/templates` (ex: pelo
    link "Gerenciar" dentro da tela de Conexão) já abre o grupo certo
    sem precisar clicar de novo.
  - Visual: grupo é um `<button>` (não `NavLink`, já que não navega
    sozinho) com `ChevronDown` que gira 180° quando aberto; filhos
    aparecem indentados com uma borda à esquerda (mesmo idioma visual
    de "sub-nível" que outras ferramentas usam), ícone/fonte um pouco
    menores que os itens de primeiro nível.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-10 — variáveis de template nomeadas, sem "Personalizado", zero digitação

Passou por 3 versões no mesmo dia (nenhuma delas foi a produção -
sempre substituídas antes de deploy): legenda estática → rótulo livre
por variável (`variable_labels`) → rótulo + fonte com opção
"Personalizado" (`variables: {label, source}[]`). Usuário pediu a
versão final: **remover "Personalizado"** de vez ("não faz sentido") e
perguntou se a Meta suporta nome em vez de número pra ficar mais claro
visualmente - resposta: sim, parâmetro nomeado de verdade
(`{{nome_lead}}`, não `{{1}}`). Como só sobraram os 4 campos fixos do
CRM, o **backend passou a resolver tudo sozinho** (ver `CLAUDE.MD` do
backend, decisão #27) - o frontend não manda mais nenhum valor de
variável, só o `template_id`.

- **`MessageTemplatesPage.tsx` (`CreateTemplateDialog`)** bem mais
  simples que as versões anteriores: 4 botões fixos acima do textarea -
  "Nome do Lead", "Telefone do Lead", "Quem está enviando", "Nome da
  empresa" (`VARIABLE_SOURCES`, sem "Personalizado"). Clicar insere o
  token fixo (`{{nome_lead}}` etc, `MESSAGE_TEMPLATE_VARIABLE_TOKEN` -
  espelha `VARIABLE_TOKEN` do backend) na posição do cursor (mesmo
  mecanismo de `ref` combinado de antes). Botão de uma fonte já usada
  no texto fica desabilitado (`detectVariableSources`, regex local
  espelhando `detect_variable_sources` do backend) - não faz sentido
  repetir a mesma variável duas vezes. **Sumiu**: a lista "Variáveis
  inseridas" (rótulo + `Select` de origem) - não existe mais nada pra
  configurar depois de inserir, o botão já define tudo.
  - Lista de templates mostra badges com o nome fixo de cada fonte
    usada (`template.variables_used`, vem pronto do backend - não
    precisa mais calcular nada no frontend).
- **`StartConversationDialog.tsx`** fica só **escolher o template e
  clicar em Enviar** - sem nenhum campo de texto pra preencher.
  `resolveVariableValue(source)` existe só pra montar a
  **pré-visualização** (usa `lead`/`useAuth().employee`/`useCompany()`,
  já disponíveis no componente) - **não é mais isso que é enviado pro
  backend**, é só cosmético/preview; o backend resolve os valores de
  novo, com o dado mais atual, na hora de mandar de verdade. `POST
  /leads/{id}/start-conversation` perdeu o campo `variables` do corpo -
  o `startConversation` (`useLeads.ts`/`leadService.ts`) manda só
  `{template_id}`.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-10 — página de ajuda dos Templates (regras da Meta)

Usuário pediu pra dar acesso à documentação da Meta sobre templates pra
facilitar pros clientes. Mesmo padrão já usado no WhatsApp (decisão
2026-07-23, `WhatsappHelpPage.tsx`/`metaTutorial.tsx`) - página própria
escrita na nossa linguagem (não link cru pra doc técnica em inglês
voltada a desenvolvedor), com link discreto pra fonte oficial só como
referência extra.

- **`TemplatesHelpPage.tsx`** (novo, rota `/whatsapp/templates/ajuda`,
  mesma proteção `RequirePermission` de `/whatsapp/templates`) - 4
  cards numerados (mesmo componente visual de `WhatsappHelpPage.tsx`):
  categoria certa (Utilidade/Marketing/Autenticação e quando usar cada
  uma), tamanho do corpo/rodapé (1024/60 caracteres - pesquisado na doc
  oficial da Meta, bate com os `max_length` que o formulário de criar
  template já validava), o que a Meta rejeita (dado sensível, preço
  enganoso, produto proibido, texto genérico demais, template
  duplicado), tempo de aprovação (minutos a 48h).
  - **Alert específico sobre Marketing**: como nosso criador de
    template não suporta botão ainda (fora de escopo, decisão #25 do
    backend) e a Meta exige opt-out pra essa categoria, o texto
    recomenda usar Utilidade pra reengajar Lead em vez de Marketing -
    orientação prática, não só regra copiada da Meta.
- **`metaTemplateGuidelines.tsx`** (novo) - `MetaTemplateGuidelinesLink`,
  mesmo padrão de `metaTutorial.tsx`/`MetaTutorialLink`, aponta pra
  `developers.facebook.com/.../templates/overview`.
- **`MessageTemplatesPage.tsx`** ganhou o link "Como evitar rejeição da
  Meta" no cabeçalho, mesmo lugar/estilo do link "Ver passo a passo" já
  usado em `WhatsappPage.tsx`.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-11 — Puka Copilot (assistente do consultor)

Pedido do usuário: IA que lê a conversa Lead↔consultor e ajuda a
contornar objeção/fechar, **sem nunca falar com o Lead** - ver
`CLAUDE.MD` do backend, decisão #28, pro desenho completo (por que não
fere regra da Meta, previsão de custo que levou ao pré-filtro em 2
camadas, contrato do webhook n8n novo). **100% automático, sem botão**
- a primeira versão desta entrega tinha por engano um botão "Sugerir
resposta" além da checagem automática; corrigido ainda no mesmo dia
depois do usuário apontar que a decisão fechada era só automático
(nenhuma versão com o botão chegou a ir pra produção).

- **`src/types/copilot.ts`, `src/services/copilotService.ts`,
  `src/hooks/useCopilotSuggestion.ts`** — mesmo padrão de types/service/
  hooks do resto do app, com uma particularidade: **não existe GET de
  listagem nem `POST` de "pedir sugestão"** - o único jeito de uma
  sugestão existir é o push automático via WebSocket.
  `useCopilotSuggestion(conversationId)` por isso é um `useQuery` com
  `enabled: false`/`initialData: null` - um slot de cache "só leitura"
  que o WebSocket escreve via `setQueryData` (mesmo raciocínio de
  "cache é a única fonte da verdade" já usado em
  `useNotificationSocket`); `useMarkCopilotSuggestionUsed` é a única
  mutation que existe aqui.
- **`useNotificationSocket()` (`useNotifications.ts`) ganhou um branch
  novo** - o copiloto usa o **mesmo socket** `/ws/notifications` (não
  abre uma conexão própria), mas o payload automático vem com
  `event: "copilot_suggestion"` em vez do formato de `Notification`
  normal. `onmessage` agora checa esse campo primeiro: se for o evento
  do copiloto, escreve em `copilotSuggestionKey(conversation_id)` e
  retorna cedo (sem virar item do sino, sem contador).
- **`CopilotPanel.tsx`** (novo) - painel **ao lado** do chat (3ª coluna
  em `ConversationsPage.tsx`, depois de `ConversationDetail`), **só
  renderiza quando a conversa já tem `assigned_employee_id`** (reflete
  a mesma trava do backend - copiloto não existe enquanto a IA responde
  sozinha). Sem botão nenhum - só um estado de espera ("sem sugestão no
  momento") até chegar algo pelo WebSocket, aí mostra objeção
  identificada (se houver) + texto sugerido + botão "Usar esta
  sugestão".
- **"Usar esta sugestão" nunca manda nada sozinho** - só preenche o
  campo de resposta do consultor pra ele revisar/editar e mandar pelo
  fluxo já existente. Implementado levantando um pequeno estado
  (`draftMessage`) em `ConversationsPage.tsx`, passado como prop pra
  `ConversationDetail` (que aplica via `setValue('content', ...)` do
  react-hook-form, num `useEffect`) e como callback pra `CopilotPanel`
  - os dois componentes são irmãos, não têm outra forma de se
  comunicarem diretamente.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. **Não
  testado visualmente num navegador** nesta sessão (sem ferramenta de
  automação de navegador disponível) - validar manualmente o fluxo
  completo ("Usar esta sugestão" preenchendo o campo certo, painel
  some/aparece junto com `assigned_employee_id`, sugestão chegando
  sozinha quando o backend/n8n empurram) antes de considerar essa tela
  pronta pra uso real.

## ✅ Novo em 2026-08-11 — Tela de Distribuição

Pedido do usuário: os campos de rodízio por funcionário
(`receive_leads`/`distribution_enabled`/`distribution_priority`/
`max_active_leads`) existem no backend desde a Fase 1, mas **nunca
tiveram UI nenhuma** - não dava pra configurar isso sem mexer direto no
banco (foi assim que o Owner de uma empresa piloto acabou entrando no
rodízio sem querer, ver `CLAUDE.MD` do backend, decisão #30).

- **`src/pages/distribution/DistributionPage.tsx`** (novo, rota
  `/distribuicao`, item próprio na sidebar entre Funcionários e Cargos)
  - mesma permissão de Funcionários (`EMPLOYEES/employee/VIEW`), sem
    permissão nova no backend.
- **Tabela por funcionário** (`GET /employees` + `PATCH /employees/
{id}`, já existiam) - uma linha por funcionário com: Switch "Participa
  do rodízio" (liga/desliga `receive_leads` **e** `distribution_enabled`
  juntos - o backend só considera os dois `True` ao mesmo tempo, então
  virou um interruptor só em vez de dois campos confusos), campo de
  Prioridade e campo de Limite de leads ativos (os dois com auto-save
  ao perder o foco - `onBlur`, não precisa de botão "Salvar" por
  célula, mais limpo numa tabela com várias linhas editáveis).
- **Card "Redistribuição por inatividade"** **migrado** de dentro de
  Minha Empresa (`CompanyPage.tsx`) pra cá - decisão do usuário de
  consolidar tudo que é "distribuição" (por funcionário + da empresa)
  num lugar só, em vez de espalhar em duas telas. Mesmo componente/
  lógica de antes (`PATCH /companies/me`), só mudou de tela.
- `src/types/employee.ts` ganhou os 4 campos em `Employee`/
  `EmployeeUpdateRequest` (não existiam no tipo do frontend antes,
  mesmo já existindo no backend).
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Corrigido em 2026-08-11 — separação de carteira entre consultores

Achado testando com uma conta "Consultora": ela via a lista inteira de
Leads/Conversas da empresa, e o painel do Puka Copilot aparecia mesmo
em conversa atribuída a outro colega. Ver `CLAUDE.MD` do backend,
decisão #31, pro desenho completo (`GET /leads`/`GET /conversations`
agora escopados por `Role.hierarchy_level` - Supervisor+ continua
vendo tudo, abaixo disso só a própria carteira).

- **Nenhuma mudança de código exigida pra listagem** - o frontend já
  só renderiza o que a API devolve, então `LeadsPage.tsx`/
  `ConversationsPage.tsx` passaram a mostrar menos automaticamente pra
  quem tem cargo abaixo de Supervisor, sem precisar de filtro novo no
  cliente.
- **`ConversationsPage.tsx`** - `CopilotPanel` tinha um bug real,
  achado no mesmo teste: só checava se a conversa **tinha** alguém
  atribuído, não se era **o funcionário logado**. Corrigido pra
  comparar `activeConversation.assigned_employee_id === employee?.id`
  (`useAuth()`) - o copiloto é pessoal e intransferível, não deveria
  aparecer pra quem só tem permissão de ver a conversa (ex: Owner
  olhando o trabalho de um consultor).
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Corrigido em 2026-08-11 — nome de lead sumindo + trava de resposta

Dois achados testando a separação de carteira (seção acima) com uma
conta "Consultora" de verdade. Ver `CLAUDE.MD` do backend, decisão #32,
pro desenho completo.

- **`ConversationRead` ganhou `lead_full_name`/`lead_phone`** vindos
  prontos do backend - `ConversationsPage.tsx`, `ConversationDetail.tsx`,
  `AssignConversationDialog.tsx` e o card "Conversas que precisam de
  atenção" do `DashboardPage.tsx` **pararam de cruzar `conversation.
lead_id` com a lista de `useLeads()`** pra resolver o nome (isso
  quebrava mostrando "Lead sem nome" pra quem tinha carteira restrita,
  já que a lista de Leads pode ser mais curta que a de Conversas
  visíveis - decisão #31). Usam `conversation.lead_full_name`
  diretamente agora - `useLeads()` saiu desses 3 primeiros arquivos por
  completo (não precisavam de mais nada de lá); `DashboardPage.tsx`
  manteve o hook (ainda usa `leads` pros gráficos e pro card "Leads
  recentes").
- **Barra de resposta trava quando não é sua conversa** -
  `ConversationDetail.tsx` calcula `isAssignedToMe` (`useAuth()` vs
  `conversation.assigned_employee_id`) e, quando `false`, esconde o
  formulário e mostra uma mensagem explicando o motivo (conversa com
  outro atendente, ou ainda com a IA - "clique em Atribuir"). O backend
  também trava isso de verdade (`ConversationNotAssignedToYouError`,
  403) - a UI só evita a pessoa tentar e tomar erro.
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Corrigido em 2026-08-11 — 403 em `GET /employees` pra Consultora

Achado com a aba Network do navegador em produção: `GET /employees`
devolvia 403 pra uma conta "Consultora" (que não tem `EMPLOYEES/
employee/VIEW` por design, decisão #29 do `CLAUDE.MD` do backend).
Duas telas dependiam disso sem precisar do diretório completo:

- **`ConversationDetail.tsx`** parou de chamar `useEmployees()` -
  `conversation.assigned_employee_name` já vem pronto do backend
  (mesmo padrão do `lead_full_name`, decisão #32).
- **`AssignConversationDialog.tsx`** trocou `useEmployees()` por
  **`useAssignableEmployees()`** (novo, `GET /conversations/
assignable-employees` - lista enxuta, só id/nome, liberada pra quem já
  tem permissão de transferir conversa).
- Testado com `tsc -b`, `oxlint` e `npm run build` limpos. Não testado
  visualmente num navegador nesta sessão.

## ✅ Novo em 2026-08-11 — notificação de mensagem nova

Backend ganhou `NotificationType.NEW_MESSAGE` (ver `CLAUDE.MD` do
backend, decisão #36) - avisa o atendente quando o Lead manda mensagem
numa conversa já assumida por ele. `types/notification.ts` ganhou o
valor no union; `NotificationBell.tsx` ganhou o ícone
(`MessageSquareText`). Nenhuma mudança de lógica necessária -
`handleSelect` já navegava por `related_conversation_id`, que esse tipo
novo também preenche.

## ✅ Novo em 2026-08-12 — autoedição de perfil + troca de senha obrigatória

Backend ganhou `PATCH /employees/me` e `POST /employees/me/change-password`
(ver `CLAUDE.MD` do backend, decisão #37) - faltava uma tela pra pessoa
editar os próprios dados, e a senha temporária do primeiro acesso
(`must_change_password`) nunca era cobrada em lugar nenhum.

- **`src/pages/profile/EditProfileDialog.tsx`** (novo) - form
  nome/email/telefone, usa `useUpdateMyProfile()`.
- **`src/pages/profile/ChangePasswordDialog.tsx`** (novo) - **mesmo
  componente** pros dois fluxos: troca voluntária (item de menu) e a
  troca obrigatória do primeiro acesso, diferenciados por uma prop
  `mandatory`. Com `mandatory=true`: sem botão Cancelar, sem X de
  fechar, `onInteractOutside`/`onEscapeKeyDown` bloqueados - a pessoa
  não consegue sair da tela sem trocar a senha. Sempre exige
  `current_password` (mesmo na temporária, o backend valida contra o
  hash atual).
- **`DialogContent` (`components/ui/dialog.tsx`) ganhou a prop
  `hideClose`** - antes o X de fechar era sempre renderizado
  incondicionalmente; precisou virar opcional pra viabilizar o popup
  obrigatório.
- **`src/hooks/useProfile.ts`** (novo) - `useUpdateMyProfile()`/
  `useChangeMyPassword()`, os dois escrevem o resultado direto na
  query key `['auth','me']` (mesma usada pelo `AuthContext`) - reflete
  em todo o app na hora, sem precisar de refetch nem re-login.
- **`Topbar.tsx`** - dropdown do avatar ganhou "Meu perfil"/"Alterar
  senha" entre o cabeçalho (nome/email) e "Sair".
- **`AppLayout.tsx`** - monta `<ChangePasswordDialog mandatory>` com
  `open={employee?.must_change_password === true}` - assim que a troca
  dá certo, o cache de `employee` atualiza e o popup some sozinho.
- **`types/auth.ts`** - `EmployeeMe` ganhou `phone` (o backend não
  expunha, precisava pro form vir pré-preenchido).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. UI no navegador não
  verificada visualmente nesta entrega (sem ferramenta de automação de
  browser disponível na sessão) - lógica conferida via build/lint e
  pelos testes ponta a ponta do backend (decisão #37).

## ✅ Novo em 2026-08-12 — iniciar conversa com vários Leads de uma vez

Backend ganhou `POST /leads/start-conversation-bulk` (ver `CLAUDE.MD`
do backend, decisão #38) - pedido do usuário: na tela de Conversas, um
botão que abre um seletor de contatos com multi-seleção, em vez de
precisar ir em Leads e disparar um por um.

- **`StartConversationBulkDialog.tsx`** (novo,
  `src/pages/conversations/`) - fluxo em 3 passos, pensado como um
  picker de agenda de contatos (busca por nome/telefone, checkbox por
  linha, avatar com iniciais, "N selecionados" com atalho "Selecionar
  visíveis"/"Limpar"):
  1. **Selecionar contatos** - só mostra Leads **sem** conversa `OPEN`
     (cruza `useLeads()` com `useConversations()`) - quem já tem
     conversa aberta já está na lista principal de Conversas, não faz
     sentido oferecer "iniciar" de novo pra essa pessoa.
  2. **Escolher template** - mesmo componente/lógica de preview do
     `StartConversationDialog.tsx` (tela de Leads, gatilho de 1 Lead só,
     decisão de 2026-08-07) - contatos selecionados aparecem como chips
     removíveis, preview usa o primeiro selecionado como exemplo com
     aviso de que cada um recebe a mensagem com os próprios dados
     (renderização de verdade continua 100% no backend, decisão #27).
  3. **Resultado** - lista sucesso/erro por contato (ícone + mensagem de
     erro quando falhou); clicar num item que deu certo abre a
     conversa. Nunca trava no meio por causa de 1 contato problemático -
     o backend já isola por item (decisão #38).
- Botão de entrada: ícone `MessageSquarePlus` no cabeçalho da lista de
  Conversas (`ConversationsPage.tsx`), condicionado a
  `hasPermission('CONVERSATIONS', 'conversation', 'CREATE')` - mesma
  permissão que já gate o botão equivalente na tela de Leads.
- **`useStartConversationBulk()`** (`hooks/useLeads.ts`) invalida tanto
  a lista de conversas quanto a de leads ao terminar (mesmo lead pode
  ganhar uma `Conversation` nova).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. UI no navegador não
  verificada visualmente nesta entrega (sem ferramenta de automação de
  browser disponível na sessão) - a lógica de filtro/estado foi
  revisada por leitura, e o backend foi testado ponta a ponta
  isoladamente (decisão #38).

## ✅ Novo em 2026-08-12 — telefone formatado na tela de Leads

Pedido do usuário: `lead.phone` é gravado como veio (dígitos crus do
webhook da Meta, ou o que a pessoa digitou no cadastro manual) e
aparecia sem formatação nenhuma na tabela.

- **`src/utils/phone.ts`** (novo) - `formatPhone(phone)` normaliza pelos
  dígitos e formata como `+xxx (xx) xxxxx-xxxx` (móvel, 9 dígitos) ou
  `+xxx (xx) xxxx-xxxx` (fixo, 8 dígitos). **Assume DDI `55` (Brasil)**
  quando o número não vem com DDI (10-11 dígitos) - único mercado do
  produto hoje. Formato não reconhecido (nem 10-13 dígitos) devolve o
  telefone original sem mexer, em vez de arriscar um resultado errado.
- Aplicado em toda exibição somente-leitura de `lead.phone` no app:
  `LeadsPage.tsx` (tabela), `PipelinePage.tsx` (card do Kanban),
  `LeadDetailDialog.tsx` (cabeçalho do diálogo), `StartConversationDialog.tsx`
  (título, quando o Lead não tem nome) e `StartConversationBulkDialog.tsx`
  (linha do contato, chip removível, texto de exemplo da pré-visualização,
  linha de resultado). Nunca mexeu em `Lead.phone` armazenado.
  Busca do picker (`lead.phone.includes(query)`) continua comparando o
  valor cru, não o formatado - buscar só por dígitos continua funcionando.
- **Não formata a variável `{{telefone_lead}}` dentro do texto do
  Message Template** (`resolveVariableValue`, caso `LEAD_PHONE`, nos dois
  diálogos de iniciar conversa) - de propósito: esse valor é o que o
  backend realmente resolve e envia pro Lead (`_resolve_variable_values`,
  decisão #27), então a pré-visualização tem que continuar batendo com o
  que sai de verdade. Formatar só ali criaria uma pré-visualização
  enganosa.
- Testado: conferido com telefone móvel com/sem DDI, fixo, e telefone
  já formatado (`+55 11 94035-4855`, idempotente). `tsc -b`/`vite
  build`/`oxlint` limpos.

## ✅ Novo em 2026-08-12 — botões em Message Template

Backend ganhou `MessageTemplate.buttons` (ver `CLAUDE.MD` do backend,
decisão #39) - `QUICK_REPLY`/`URL` (com 1 variável dinâmica opcional)/
`PHONE_NUMBER`, até 10 por template. Pedido do usuário: ler a doc da
Meta e planejar antes de construir - motivado pela lacuna que a própria
`TemplatesHelpPage.tsx` já documentava (Marketing exige opt-out, "botão
- recurso que a plataforma não oferece ainda").

- **`MessageTemplatesPage.tsx` (`CreateTemplateDialog`)** ganhou uma
  seção "Botões", com **duas listas via `useFieldArray`** (primeiro uso
  desse hook no projeto) - "Respostas rápidas" (`QUICK_REPLY`) e
  "Botões de ação" (`URL`/`PHONE_NUMBER`, tipo escolhido por linha).
  Duas listas separadas em vez de uma genérica reflete estruturalmente
  a regra da Meta de agrupar resposta-rápida separado de ação, sem
  precisar validar reordenação na tela (o backend também reordena
  defensivamente antes de submeter, decisão #39). Botão "Adicionar" de
  cada lista desabilita ao atingir o teto (10 total, 2 `URL`, 1
  `PHONE_NUMBER`) - validação real ainda acontece no backend
  (`MessageTemplateCreate`), isso aqui é só feedback instantâneo.
- **Variável em botão de URL só concatena no final** (nunca por
  posição de cursor, diferente do corpo) - a Meta só aceita a variável
  no fim da URL, então não faz sentido oferecer inserção por cursor
  ali. Chips de variável ficam desabilitados assim que a URL já tem
  algum token (só 1 por botão).
- **Lista de templates** mostra os botões como badges com ícone por
  tipo (`Link2`/`Phone`/`MessageSquareReply`), abaixo dos badges de
  variável que já existiam.
- **Novo `src/utils/messageTemplatePreview.ts`** - extrai a lógica de
  `resolveVariableValue`/substituição que antes estava duplicada em
  `StartConversationDialog.tsx` e `StartConversationBulkDialog.tsx`,
  generalizando pra também resolver a variável dentro da `url` de cada
  botão. **Novo `src/components/message-template-buttons-preview.tsx`**
  (`MessageTemplateButtonsPreview`) - mockup somente-leitura dos
  botões, mesma pinta de como aparecem de verdade no WhatsApp (linhas
  cheias, empilhadas) - os dois diálogos de iniciar conversa (1 lead e
  em lote) agora mostram isso abaixo do preview de texto, com a URL
  dinâmica já resolvida pro Lead selecionado/exemplo.
- **`types/messageTemplate.ts`** ganhou `MessageTemplateButtonType`/
  `MessageTemplateButton`/`MESSAGE_TEMPLATE_BUTTON_TYPE_LABEL` e
  `MESSAGE_TEMPLATE_VARIABLE_SOURCES` (array das 4 fontes - existia só
  como constante local duplicada em `MessageTemplatesPage.tsx`, agora
  compartilhada com o novo helper de preview).
- **`TemplatesHelpPage.tsx`** atualizada - a lacuna de opt-out que o
  texto documentava não existe mais; agora explica como cumprir a
  exigência (botão de resposta rápida "Parar promoções" + texto de
  opt-out no corpo).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. UI no navegador não
  verificada visualmente nesta entrega (sem ferramenta de automação de
  browser disponível na sessão) - lógica conferida via build/lint e
  pelos testes ponta a ponta do backend (decisão #39, incluindo a
  reordenação de botões e o índice do componente dinâmico no envio).

## ✅ Corrigido em 2026-08-12 — Puka Copilot não mostrava sugestão gerada

Achado pelo usuário em produção: o n8n gerou e confirmou o envio de uma
sugestão (callback com 200), mas o painel continuou mostrando "Sem
sugestão no momento". Investigado (ver `CLAUDE.MD` do backend, decisão
#40): a sugestão estava salva certinha no Postgres - o push em tempo
real pelo WebSocket que nunca chegou (`NotificationConnectionManager.
push()` é fire-and-forget, sem fila/retry) e não existia nenhum jeito
de a tela buscar isso depois.

- **`useCopilotSuggestion` (`hooks/useCopilotSuggestion.ts`)** passou a
  ter `queryFn` de verdade - antes era `() => null` com `enabled: false`
  (um slot de cache só-escrita, que só o handler do WebSocket
  preenchia). Agora busca via `GET /conversations/{id}/
copilot-suggestion` (novo, `copilotService.getLatest`) ao montar, e o
  push em tempo real continua funcionando normalmente por cima (mesma
  chave de cache) - o `GET` é só fallback pro caso do push ter sido
  perdido, não substitui a entrega ao vivo.
- **`CopilotPanel.tsx`** ganhou um estado de carregamento (`Skeleton`)
  pro instante da busca inicial - antes mostrava "Sem sugestão no
  momento" de cara (fazia sentido quando a única fonte era o push, mas
  agora existe uma busca real acontecendo que merece um loading state).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. A lógica do fallback
  em si foi validada ponta a ponta nos testes do backend (decisão #40);
  não foi possível reproduzir visualmente o bug original em produção
  nesta sessão (sem ferramenta de automação de browser disponível).

## ✅ Novo em 2026-08-12 — reset administrativo de senha

Backend ganhou `POST /employees/{id}/reset-password` (ver `CLAUDE.MD`
do backend, decisão #41) - pedido do usuário: uma forma de redefinir a
senha de um funcionário sem depender de email (SMTP não está
configurado/confiável agora).

- **`EmployeesPage.tsx`** - novo item "Redefinir senha" no menu de
  ações de cada funcionário. Fluxo em 2 passos: `ConfirmDialog` (avisa
  que a senha atual do funcionário para de funcionar) → ao confirmar,
  `SecretRevealDialog` (mesmo componente já usado pra `service_api_key`
  do WhatsApp) mostra a senha temporária nova, só essa vez - quem gerou
  repassa manualmente pro colega (WhatsApp, verbalmente etc.).
- **`useResetEmployeePassword()`** (`hooks/useEmployees.ts`) invalida a
  lista de funcionários ao terminar (`must_change_password` mudou).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica validada ponta
  a ponta no backend (decisão #41); UI não verificada visualmente nesta
  sessão (sem ferramenta de automação de browser disponível).

## ✅ Novo em 2026-08-12 — notificação de aprovação/rejeição de Template

Backend ganhou `NotificationType.TEMPLATE_APPROVED`/`TEMPLATE_REJECTED`
(ver `CLAUDE.MD` do backend, decisão #43) - avisa quem cadastrou o
template quando a Meta aprova ou rejeita.

- **`NotificationBell.tsx`** ganhou os ícones (`BadgeCheck`/`BadgeX`) e,
  pela primeira vez, uma navegação por `type` em vez de `related_*` -
  esses dois tipos não têm nenhum `related_lead_id`/`related_conversation_id`/
  `related_task_id` (não existe página de detalhe por template, só a
  lista), então clicar leva direto pra `/whatsapp/templates`.
- `types/notification.ts` ganhou os dois valores no union.
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica de notificação
  validada ponta a ponta no backend (decisão #43); UI não verificada
  visualmente nesta sessão (sem ferramenta de automação de browser
  disponível).

## ✅ Novo em 2026-08-12 — Campanhas com filtro de público

Backend ganhou `POST /campaigns` + fila de envio com throttling (ver
`CLAUDE.MD` do backend, decisão #44) - tela nova pra filtrar o público
(sexo, idade, aniversário, estágio do pipeline) e disparar um template
em massa, sem o teto de 50 contatos do gatilho manual (decisão #38, que
continua existindo separado, pra disparo pontual).

- **`src/pages/campaigns/`** (novo) - `CampaignsPage.tsx` (lista com
  barra de progresso por campanha, atualizada por polling a cada 5s,
  igual `useConversations`) + `CreateCampaignPage.tsx` (wizard de 3
  passos: filtros com contador ao vivo debounced → template → confirmar
  e disparar). Item novo no menu (`Megaphone`, seção administrativa,
  gated por `CAMPAIGNS/campaign/VIEW` - primeiro módulo de permissão
  novo desde a Fase 4).
- **Wizard é página cheia (`/campanhas/nova`), não modal** - decisão do
  usuário depois de ver o diálogo pequeno em produção ("implemente isso
  na tela normal, com botões de próximo e voltar no formulário").
  `CreateCampaignDialog.tsx` (a versão em `<Dialog>`) foi **removida**,
  não mantida ao lado - mesmo raciocínio de "não deixar código morto"
  já aplicado outras vezes na sessão. `CreateCampaignPage.tsx` reaproveita
  exatamente a mesma lógica de estado/filtros/preview debounced que o
  diálogo tinha, só troca `DialogContent`/`DialogFooter` por um `Card`
  numa página normal com um `Stepper` (indicador de passo 1/2/3) e
  botões "Voltar"/"Continuar"/"Disparar campanha" no corpo do form.
  Rota nova gated por `CAMPAIGNS/campaign/CREATE` (mais restrita que a
  listagem, que só exige `VIEW`) - impede acesso direto por URL de quem
  só pode ver campanhas, não criar. `CampaignsPage.tsx` troca o botão
  "Nova campanha" de abrir estado local (`createOpen`) pra
  `navigate('/campanhas/nova')`; ao concluir, `CreateCampaignPage`
  navega de volta pra `/campanhas`.
- **Preview do template na campanha não usa `renderTemplatePreview`**
  (diferente dos diálogos de iniciar conversa) - como o público é um
  filtro, não um Lead específico, mostra o `body_text` cru com uma nota
  explicando que as variáveis são resolvidas individualmente pra cada
  contato no envio (mesmo raciocínio de sempre: resolução 100% no
  backend, nada calculado no frontend).
- **Passo "Agendamento" dedicado (4º passo do wizard), adicionado ainda
  em 2026-08-12** (decisão #45 do backend) - pedido do usuário em 2
  rodadas na mesma conversa: primeiro "faltava agendar o disparo, e
  também recorrência de verdade" (implementado inicialmente como uma
  seção dentro do passo Confirmar), depois "adicione um quarto [passo]
  para o agendamento, coloque um calendário e deixe a UI/UX bem
  acessível e clara" - promovido de seção pra passo próprio
  (`Filtros → Template → Agendamento → Confirmar`), com um calendário de
  verdade em vez de `input[type=datetime-local]`.
  - **`src/components/ui/calendar.tsx`** (novo) - calendário mensal
    construído do zero (sem `react-day-picker`/`date-fns` novos -
    mesmo raciocínio de evitar dependência nova sem necessidade clara
    já aplicado a outras decisões deste projeto). Acessível de
    propósito: `role="grid"/"row"/"gridcell"/"columnheader"`, roving
    `tabIndex` (só o dia selecionado ou hoje é focável via Tab, o resto
    é alcançado por seta), navegação por `ArrowLeft/Right/Up/Down`
    (inclusive atravessando mês), `aria-selected`/`aria-current="date"`/
    `aria-label` com a data por extenso em português por botão-dia,
    `aria-live="polite"` no rótulo do mês, dias antes de `minDate`
    desabilitados (`disabled` real, não só visual). Repetição do padrão
    `bg-brand-600` de seleção já usado no resto do app.
  - Um `role="radiogroup"` com 3 cartões clicáveis (`Agora`/`Agendar`/
    `Repetir`, com ícone + descrição curta cada) substitui o `Select` de
    3 opções da versão anterior - inputs `radio` nativos por trás (foco/
    teclado/leitor de tela de graça, sem reinventar).
  - **Agendar**: 1 `Calendar` (data) + `input type="time"` (hora,
    default `09:00`) em vez do `datetime-local` combinado de antes -
    mais claro visualmente e cada campo tem seu próprio rótulo.
  - **Repetir**: mesmo par Calendar+hora pra "início", checkboxes de dia
    da semana (`Checkbox`, mesmo componente já usado em
    `RolePermissionsDialog`) dentro de um `<fieldset>`/`<legend>`, e um
    2º `Calendar` pra "repetir até" (com `minDate` = data de início).
    Texto explicando que o público é recalculado a cada ocorrência e
    que ninguém recebe a campanha 2x continua igual.
  - Passo Confirmar ficou mais enxuto - só nome + resumo (destinatários,
    template, e uma linha com o agendamento escolhido em texto corrido,
    ex: "Recorrente: toda(o) Quinta, a partir de quinta-feira, 20 de
    agosto de 2026 às 09:00, até quinta-feira, 10 de setembro de 2026").
  - `types/campaign.ts` ganhou `scheduled_at`/`recurrence_days_of_week`/
    `recurrence_end_date` em `Campaign`/`CampaignCreateRequest`,
    `SCHEDULED` em `CampaignStatus`, e `WEEKDAY_LABEL`/
    `WEEKDAY_LABEL_SHORT` (índice = `date.weekday()` do Python,
    0=segunda).
  - **`CampaignsPage.tsx`** - badge "Recorrente" (ícone `Repeat`) nas
    campanhas com `recurrence_days_of_week`, texto de agendamento
    (`scheduleSummary`: "Agendada pra dd/mm hh:mm" ou "Toda(o) Qui até
    dd/mm/aaaa") no lugar da barra de progresso enquanto
    `total_recipients` ainda é 0 (recorrente sem nenhuma ocorrência
    gerada ainda, ou agendada única que ainda não chegou a hora).
    `canCancel`/`statusVariant` passaram a cobrir `SCHEDULED`.
- **`CreateLeadDialog.tsx`/`EditLeadDialog.tsx`** ganharam campos
  opcionais de Sexo (select) e Nascimento (`input type="date"`).
- **`LeadsPage.tsx`** mostra um badge "Não recebe campanhas" quando
  `lead.marketing_opt_out` - visibilidade de que aquele contato foi
  excluído automaticamente (resposta tipo "PARAR" detectada no
  WhatsApp).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica de filtro/fila/
  opt-out validada ponta a ponta no backend (decisão #44); UI no
  navegador não verificada visualmente (sem ferramenta de automação de
  browser disponível na sessão).

## ✅ Corrigido em 2026-08-12 — páginas de formulário "coladas" na
esquerda com muito espaço vazio

Achado pelo usuário direto num screenshot da tela de Agendamento da
campanha: o conteúdo ficava preso numa coluna estreita (`max-w-2xl`,
672px) no canto esquerdo, com boa parte da tela sobrando vazia à
direita - mesmo padrão em várias telas do app, não só nessa. Páginas de
lista (`LeadsPage`, `EmployeesPage`, `CampaignsPage` etc.) nunca tiveram
esse problema - usam `Table`/`Card` sem `max-w`, então já ocupam a
largura disponível. O problema era específico de páginas
"formulário"/wizard que herdavam o mesmo idioma `<div className="space-y-6
max-w-2xl">` copiado de tela em tela.

- **Larguras ajustadas** (`max-w-2xl` → `max-w-4xl`, ~896px):
  `AssistantPage.tsx`, `CompanyPage.tsx`, `WhatsappPage.tsx`,
  `SubscriptionPage.tsx`, `MessageTemplatesPage.tsx`,
  `CreateCampaignPage.tsx`. Escolha deliberada de não ir 100% full-bleed
  (sem `max-w` nenhum) - essas páginas têm `Textarea`s longas (ex:
  `AssistantPage`, `persona`/`business_rules` com `rows=4`) que ficariam
  com linhas de texto desconfortavelmente compridas numa tela ultra-wide;
  896px é bem mais largo que os 672px de antes sem sacrificar
  legibilidade.
- **`WhatsappHelpPage.tsx`/`TemplatesHelpPage.tsx`** (`max-w-2xl` →
  `max-w-3xl`, ~768px) - subida menor de propósito: são páginas de
  prosa (parágrafo longo explicando regras da Meta), e linha de texto
  muito comprida piora leitura em vez de ajudar - a v2xl original já
  estava perto do ideal de ~65-75 caracteres por linha, só que
  hiper-comprimida; um meio-termo aqui, não o mesmo salto das páginas de
  formulário.
- **`CreateCampaignPage.tsx` ganhou mais que só a largura maior** - é a
  página do screenshot original, então recebeu atenção extra pra
  realmente usar o espaço, não só esticar com vazio maior:
  - Passo **Filtros**: Sexo/Mês/Idade mínima/Idade máxima viraram uma
    grid única `sm:grid-cols-2 lg:grid-cols-4` (antes eram 2 grids
    `grid-cols-2` empilhadas) - os 4 campos curtos cabem numa linha só
    em telas largas.
  - Passo **Agendamento**: virou grid de 2 colunas quando `Agendar`/
    `Repetir` está selecionado - calendário à esquerda, horário +
    resumo (`Alert` com a data/hora escolhida por extenso) à direita;
    modo `Repetir` usa a largura pra colocar calendário de início +
    horário numa coluna e checkboxes de dia da semana + calendário de
    "até" na outra, com o resumo final ocupando as duas colunas embaixo.
    Card `Quando enviar` (os 3 cartões `Agora`/`Agendar`/`Repetir`)
    ganhou padding maior (`p-4` em vez de `p-3`) pra acompanhar o resto.
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. UI no navegador não
  verificada visualmente nesta sessão (sem ferramenta de automação de
  browser disponível) - o achado original veio de um screenshot real do
  usuário, não foi possível reconferir visualmente o resultado do ajuste
  ainda dentro desta sessão.

## ✅ Novo em 2026-08-12 — notificação de status de campanha + tela de
detalhes

Backend ganhou `CAMPAIGN_COMPLETED`/`CAMPAIGN_CANCELED` (decisão #46) e
`GET /campaigns/{id}/recipients` - pedido do usuário logo depois do ajuste
de largura das páginas: notificar quando uma campanha muda de status, e
uma tela pra ver os detalhes de uma campanha mesmo já concluída.

- **`NotificationBell.tsx`** ganhou os 2 ícones novos (`Megaphone`/
  `MegaphoneOff`) e passou a navegar por `related_campaign_id` (novo campo
  em `Notification`) antes de cair nos outros `related_*` - primeira
  notificação do app a levar direto pra uma tela de detalhe específica em
  vez de só a lista (diferente do padrão usado pra Template, decisão #43,
  que não tinha tela de detalhe por item ainda).
- **`src/pages/campaigns/CampaignDetailPage.tsx`** (novo, rota
  `/campanhas/:campaignId`, mesma permissão `VIEW` da listagem) - cabeçalho
  com nome/status/badge "Recorrente"/botão Cancelar (quando aplicável),
  card de progresso (barra + contadores enviados/falharam/restam +
  timestamps de início/conclusão) e uma tabela de destinatários (nome/
  telefone do Lead, status individual, motivo do erro quando `FAILED`,
  data de envio). Continua acessível depois de `COMPLETED`/`CANCELED` -
  era exatamente a lacuna que o usuário apontou (só dava pra ver
  campanhas ativas na lista, sem detalhe nenhum depois).
- **Linhas de `CampaignsPage.tsx` viraram clicáveis** (`role="button"`,
  navega pro detalhe) - o botão de cancelar usa `stopPropagation` pra não
  disparar a navegação junto.
- **`useCampaignRecipients(id, activelyProcessing)`** (novo hook) - só
  faz polling (3s) enquanto a campanha ainda pode gerar/processar mais
  gente (`SCHEDULED`/`QUEUED`/`RUNNING`); campanha `COMPLETED`/`CANCELED`
  busca uma vez só, sem polling - não tem por que continuar reconsultando
  algo que não muda mais.
- **`src/utils/campaignFormat.ts`** (novo) - extrai `CAMPAIGN_STATUS_VARIANT`/
  `formatDateTime`/`formatDateOnly`/`scheduleSummary` de dentro de
  `CampaignsPage.tsx` (estavam definidos ali, agora reaproveitados também
  por `CampaignDetailPage.tsx` sem duplicar).
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica de notificação
  (1 evento por transição terminal, não uma por ocorrência de recorrente)
  validada ponta a ponta no backend (decisão #46); UI no navegador não
  verificada visualmente (sem ferramenta de automação de browser
  disponível na sessão).

## ✅ Novo em 2026-08-12 — campanha nunca "atravessa" conversa aberta

Pedido do usuário: cuidado pra campanha não interferir num atendimento já
em andamento, e checar as normas da Meta sobre a janela de 24h antes de
mexer (ver decisão #47 do backend - pesquisado contra a doc oficial: o
risco real não é a janela de 24h em si, é o pacing de templates de
Marketing por usuário que a Meta aplica, erro `131049` se estourar).
Backend passou a nunca incluir num público de campanha (nem na criação,
nem reavaliando ocorrência de recorrente, nem no momento do envio) um
Lead que já tem uma conversa `OPEN`.

- **`types/campaign.ts`** ganhou `SKIPPED_ACTIVE_CONVERSATION` em
  `CampaignRecipientStatus`/`CAMPAIGN_RECIPIENT_STATUS_LABEL` ("Pulado
  (conversa em andamento)") - aparece na tabela de destinatários da
  `CampaignDetailPage.tsx` igual o `SKIPPED_OPT_OUT` já existente.
- **`CreateCampaignPage.tsx`** - texto de aviso no passo Filtros
  atualizado ("Leads que já pediram pra não receber campanha, ou que já
  têm uma conversa em andamento (com humano ou com a IA), nunca
  entram...").
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica de exclusão
  validada ponta a ponta no backend (decisão #47, inclusive o caso de
  corrida - Lead abre conversa depois do snapshot mas antes do envio);
  UI no navegador não verificada visualmente (sem ferramenta de
  automação de browser disponível na sessão).

## ✅ Novo em 2026-08-13 — banner e popup de trial vencido sem cobrança

Pedido do usuário depois de reportar um caso real (Aqua Fit Club, trial
vencido sem nenhuma cobrança gerada nem no Asaas nem na plataforma - ver
decisão #48 do backend pro root cause completo). Duas peças novas,
ambas em `src/modules/layout/` ao lado de `Topbar.tsx`/`Sidebar.tsx`/
`NotificationBell.tsx`:

- **`BillingBanner.tsx`** - faixa persistente (não dispensável) logo
  abaixo do `Topbar`, renderizada em `AppLayout.tsx` pra qualquer
  funcionário logado. Alimentada por `useSubscriptionStatus()` (novo
  hook, `GET /subscription/status` - endpoint enxuto sem exigir
  `SUBSCRIPTION/subscription/VIEW`, já que a matriz da decisão #29 não
  dá essa permissão pra Supervisor/Consultora/Recepção, e o banner
  precisa aparecer pra todo mundo). Dois textos diferentes: "O período
  de teste acabou..." (`TRIALING` com `trial_ends_at` no passado,
  cor `warning`) ou "Sua assinatura está com pagamento pendente."
  (`PAST_DUE`, cor `destructive`) - o link/botão de ação em cada um só
  aparece pra quem tem a permissão correspondente
  (`COMPANY/company/UPDATE` pro primeiro, `SUBSCRIPTION/subscription/
VIEW` pro segundo).
- **`BillingSetupDialog.tsx`** - popup **dispensável** (diferente do
  popup obrigatório de trocar senha no primeiro acesso, decisão #37) -
  abre sozinho uma vez por carregamento do app quando o trial já
  acabou, mas pode ser fechado e continua usando a plataforma
  normalmente (o banner segue ali até resolver). Quem tem
  `COMPANY/company/UPDATE` vê um campo de CPF/CNPJ que já chama `PATCH
  /companies/me` (`useUpdateCompany`, existente) - o backend já
  tenta provisionar a assinatura no Asaas de novo sozinho ao salvar,
  sem passo manual extra. Quem não tem essa permissão só vê "fale com o
  Dono ou Administrador da sua empresa".
- **Ações de maior custo bloqueadas pelo backend** (Campanhas, iniciar
  conversa via Template, criar Funcionário/Cargo, Assistente/WhatsApp)
  quando o trial vence sem assinatura no Asaas - decisão do usuário
  depois de apontar que só avisar deixaria a empresa usar o sistema
  indefinidamente sem pagar. **Não precisou de nenhuma tela de "bloqueado"
  nova** - o backend devolve `402` com uma mensagem clara no `detail`, e
  o padrão de toast já usado em toda mutação do app (`error instanceof
  ApiError ? error.message : undefined`) já exibe isso automaticamente,
  sem código novo por tela. `POST /conversations/{id}/messages`
  (responder Lead) tem 1 dia de carência a mais que as outras - decisão
  explícita do usuário de manter o atendimento básico liberado por mais
  tempo.
- **`NotificationBell.tsx`** ganhou `TRIAL_ENDED_NO_BILLING` (ícone
  `CreditCard`, navega pra `/empresa`) - a notificação em si (avisando o
  Owner quando o job do backend detecta o trial vencido) já existia do
  lado do backend, decisão #48.
- Testado: `tsc -b`/`vite build`/`oxlint` limpos. Lógica de bloqueio
  (`require_active_billing`, com e sem carência) e do job de aviso
  validada ponta a ponta no backend; UI no navegador não verificada
  visualmente (sem ferramenta de automação de browser disponível na
  sessão).
- **Corrigido no mesmo dia, achado testando em produção**: usuário
  preencheu o CPF/CNPJ de verdade e salvou, mas o banner e o popup
  continuaram achando que faltava documento. Causa do lado do backend
  (ver decisão #48 - preencher o documento não muda `Subscription.status`
  sozinho, só o webhook de pagamento confirmado faz isso).
  `SubscriptionStatusInfo` ganhou `has_billing_configured: boolean` -
  `BillingBanner.tsx` agora distingue 3 situações em vez de 2: trial
  acabou sem documento (mostra o popup) vs trial acabou **com**
  documento já preenchido, aguardando confirmação de pagamento ("há um
  débito em aberto", sem popup) vs `PAST_DUE` de verdade. O popup
  (`BillingSetupDialog.tsx`) só monta quando realmente falta o
  documento, então some sozinho assim que resolvido.

## Comandos úteis

```bash
npm install
npm run dev
# .env.local precisa de VITE_API_URL apontando pro crm-backend
```
