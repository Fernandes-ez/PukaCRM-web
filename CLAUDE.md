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

## Comandos úteis

```bash
npm install
npm run dev
# .env.local precisa de VITE_API_URL apontando pro crm-backend
```
