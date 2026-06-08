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

## Fase 3 — Portal do Técnico e Assistência Técnica
- [ ] **Portal técnico**: Roteiro diário no celular para o técnico iniciar e finalizar atendimentos.
- [ ] **Orçamentos técnicos**: Fluxo para o técnico listar peças necessárias e o cliente aprovar pela plataforma.
- [ ] **Histórico e Fotos**: Upload de imagens de defeito/conserto e registro de histórico de status da OS.

---

## Fase 4 — Venda Consultiva e Administrativo
- [ ] **Produtos**: Tela detalhada de equipamentos odontológicos com checkout integrado.
- [ ] **Clientes**: Painel completo de administração para gerenciar o perfil de clínicas odontológicas.
- [ ] **Técnicos**: Painel de gerenciamento de especialidades dos técnicos de campo.
- [ ] **Ordens de serviço**: Gestão administrativa de fluxo de suporte da empresa.

---

## Fase 5 — Mensageria (WhatsApp) e Finalização
- [ ] **WhatsApp**: Disparos reais de templates pelo Z-API ao criar/atualizar OS e pedidos.
- [ ] **Testes**: Execução de baterias de testes unitários e de integração de ponta a ponta.
- [ ] **Deploy**: Configuração e publicação do ambiente de produção.
