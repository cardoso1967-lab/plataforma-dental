# Roadmap de Desenvolvimento — Plataforma Dental

Acompanhamento de tarefas por fase para o projeto Plataforma Dental.

## Fase 1 — Estrutura Inicial e Base de Dados (Concluída)
- [x] **Preparação**: Inicialização do projeto Next.js + TS + Tailwind e configurações globais.
- [x] **Banco de dados**: Criação da migração inicial com enums, tabelas, triggers e RLS. *(Aplicada com sucesso no Supabase)*
- [x] **Estrutura do app**: Organização de pastas, criação de rotas (públicas, admin, cliente, técnico) e layouts.
- [x] **Mobile first**: Criação dos componentes base responsivos (BottomNav, Sidebar, cards e botões).

---

## Fase 2 — Autenticação e Portal do Cliente (Concluída)
- [x] **Autenticação**: Integração do Supabase Auth para controle e proteção das rotas de admin, cliente e técnico.
- [x] **Portal cliente**: Implementação da visualização detalhada dos equipamentos e histórico de pedidos.
- [x] **Abertura de chamados**: Formulário integrado ao banco de dados para o cliente abrir ordens de serviço.

---

## Fase 3 — Gestão Operacional e Agenda Kanban (Concluída)
- [x] **Clientes**: CRUD completo e real integrado ao Supabase para gerenciar clínicas e dentistas.
- [x] **Técnicos**: Painel completo para gerenciamento de especialidades dos técnicos de campo.
- [x] **Produtos**: CRUD de produtos no painel administrativo para cadastrar equipamentos e peças.
- [x] **Equipamentos do Cliente**: Cadastro e listagem de equipamentos (`client_equipment`) por cliente.
- [x] **Ordens de Serviço (OS)**: Criação manual de OS con designação de técnicos e agendamento.
- [x] **Agenda Kanban**: Visualização interativa con status e Drag & Drop para desktop.
- [x] **Agenda Lista**: Visualização em lista estruturada con filtros operacionais em tempo real.
- [x] **Histórico de Status**: Registro automático de alterações de status em `service_order_status_history`.

---

## Fase 4 e 4.1 — Refinamento Visual Premium, UX Operacional e Correções Técnicas (Concluída)
- [x] **Correção Técnico**: Resolvido o erro `column customers_1.phone does not exist` que impedia o carregamento de `/tecnico/dashboard`, `/tecnico/servicos` e `/tecnico/agenda`.
- [x] **Migração 004**: Criada a migração `004_add_customer_contact_fields.sql` adicionando com segurança (`ADD COLUMN IF NOT EXISTS`) os campos `contact_name`, `email`, `phone`, `whatsapp` e `notes` à tabela `customers`.
- [x] **Dashboard Admin**: Indicadores e cards de métricas integrados em tempo real ao Supabase (OS sem técnico, urgentes, visitas de hoje, orçamentos pendentes).
- [x] **Agenda Kanban e Lista**: Refinamento de layout das colunas e cards de OS, filtros colapsáveis e visualização mobile adaptada a cards táctiles. Correção completa de lints e estruturas JSX.
- [x] **Formulários e CRUDs**: Homologação visual de inputs, modales com efeito cristal/glassmorphism e botões com spinner `RefreshCw`.
- [x] **Portal Técnico**: Roteiro e agenda operacional 100% dinâmicos integrados com o Supabase e otimizados para smartphones, com botões de ação e alteração de status em campo.
- [x] **Portal Cliente**: Refinamento estético das abas de compras e equipamentos, e adição do visualizador gráfico de progresso (Timeline) para acompanhamento das Ordens de Serviço.
- [x] **Responsividade e Compilação**: Verificação de layout sem scroll horizontal inadequado e homologação de build de produção Next.js 100% livre de erros (através de `cmd /c npm run build`).

---

## Fase 5 — Assistência de Campo, Orçamentos e Mensageria (Próxima)
- [ ] **Orçamentos técnicos**: Fluxo para o técnico detalhar peças e o cliente aprovar pela plataforma.
- [ ] **Histórico e Fotos**: Upload de imagens de defeito/conserto direto nas ordens de serviço.
- [ ] **Mensageria (WhatsApp)**: Disparos automáticos pelo Z-API ao criar/atualizar OS e pedidos.
- [ ] **Deploy e Produção**: Publicação final do ambiente de produção em nuvem.
