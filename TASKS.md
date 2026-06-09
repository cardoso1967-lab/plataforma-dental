# Roadmap de Desenvolvimento — Plataforma Dental

Acompanhamento de tarefas por fase para o projeto Plataforma Dental.

## Fase 1 — Estrutura Inicial e Base de Dados (Atual)
- [x] **Preparação**: Inicialização do projeto Next.js + TS + Tailwind e configurações globais.
- [x] **Banco de dados**: Criação da migração inicial com enums, tabelas, triggers e RLS. *(Aplicada com sucesso no Supabase)*
- [x] **Estrutura do app**: Organização de pastas, criação de rotas (públicas, admin, cliente, técnico) e layouts.
- [x] **Mobile first**: Criação dos componentes base responsivos (BottomNav, Sidebar, cards e botões).

---

## Fase 2 — Autenticação e Portal do Cliente (Concluída — Homologada com sucesso para todos os perfis)
- [x] **Autenticação**: Integração do Supabase Auth para controle e proteção das rotas de admin, cliente e técnico.
- [x] **Portal cliente**: Implementação da visualização detalhada dos equipamentos e histórico de pedidos.
- [x] **Abertura de chamados**: Formulário integrado ao banco de dados para o cliente abrir ordens de serviço.

---

## Fase 3 — Gestão Operacional e Agenda Kanban (Concluída)
- [x] **Clientes**: CRUD completo e real integrado ao Supabase para gerenciar clínicas e dentistas.
- [x] **Técnicos**: Painel completo para gerenciamento de especialidades dos técnicos de campo.
- [x] **Produtos**: CRUD de produtos no painel administrativo para cadastrar equipamentos e peças.
- [x] **Equipamentos do Cliente**: Cadastro e listagem de equipamentos (`client_equipment`) por cliente.
- [x] **Ordens de Serviço (OS)**: Criação manual de OS com designação automática de técnicos e agendamento.
- [x] **Agenda Kanban**: Visualização interativa com 9 colunas de status e Drag & Drop para desktop.
- [x] **Agenda Lista**: Visualização em lista estruturada com filtros operacionais em tempo real (data, técnico, cliente, status, prioridade, cidade, equipamento).
- [x] **Histórico de Status**: Registro automático de alterações de status em `service_order_status_history`.

---

## Fase 4 — Assistência de Campo e Orçamentos (Próxima)
- [ ] **Portal técnico**: Roteiro diário no celular para o técnico iniciar e finalizar atendimentos.
- [ ] **Orçamentos técnicos**: Fluxo para o técnico listar peças necessárias e o cliente aprovar pela plataforma.
- [ ] **Histórico e Fotos**: Upload de imagens de defeito/conserto direto nas ordens de serviço.
- [ ] **Produtos (E-commerce)**: Tela detalhada de equipamentos odontológicos com checkout integrado.

---

## Fase 5 — Mensageria (WhatsApp) e Finalização
- [ ] **WhatsApp**: Disparos reais de templates pelo Z-API ao criar/atualizar OS e pedidos.
- [ ] **Testes**: Execução de baterias de testes unitários e de integração de ponta a ponta.
- [ ] **Deploy**: Configuração e publicação do ambiente de produção.
