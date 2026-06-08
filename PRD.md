# Documento de Requisitos do Produto (PRD) — Plataforma Dental

## 1. Visão Geral do Produto
A **Plataforma Dental** é uma solução digital mobile-first integrada voltada para o mercado de odontologia. O sistema atende a duas vertentes fundamentais do negócio de equipamentos odontológicos:
1. **Venda Consultiva**: Canal de vendas de equipamentos de alto valor (como cadeiras odontológicas, autoclaves e compressores) auxiliado por consultoria especializada integrada.
2. **Gestão de Assistência Técnica**: Sistema completo de emissão, acompanhamento e execução de Ordens de Serviço (OS) para consertos e manutenções preventivas/corretivas de consultórios odontológicos.

---

## 2. Objetivos Estratégicos
- **Experiência Mobile First**: A interface deve ser focada em dispositivos móveis, garantindo facilidade para técnicos de campo utilizarem no celular/tablet e para dentistas acompanharem ordens de serviço.
- **Rastreadores em Tempo Real**: Envio de notificações sobre o status da manutenção e orçamentos via WhatsApp.
- **Segurança de Dados**: Isolamento rígido de perfis (RLS - Row Level Security) garantindo que clientes vejam apenas seus dados e técnicos apenas as ordens atribuídas a eles.

---

## 3. Personas & Perfis de Acesso
O sistema possui 5 perfis de usuários bem delimitados:

| Perfil | Descrição | Regra de Acesso RLS |
| :--- | :--- | :--- |
| **Admin** | Gestores do negócio, proprietários e gerentes de suporte. | Acesso completo a todas as tabelas e dados. |
| **Vendedor** | Consultores comerciais responsáveis por fechar vendas de equipamentos. | Acesso a Clientes, Produtos e Pedidos de Venda. |
| **Suporte** | Operadores que abrem ordens de serviço e organizam a agenda técnica. | Acesso a Clientes, Equipamentos, OS e Agenda Geral. |
| **Técnico** | Técnicos de campo responsáveis pelo conserto e manutenção. | Acesso apenas às Ordens de Serviço e Visitas atribuídas a ele. |
| **Cliente** | Dentistas ou gerentes de clínicas odontológicas. | Acesso apenas a seus próprios pedidos, equipamentos e ordens. |

---

## 4. Requisitos Funcionais (Fase 1)
- **Painel Geral (Admin)**: Visualização consolidada de faturamento mensal, volume de OS pendentes, técnicos em campo e tabela de pedidos/OS ativas.
- **Portal do Cliente**: Área exclusiva para acompanhar faturamento de compras e abrir solicitações técnicas para seus equipamentos instalados.
- **Portal do Técnico**: Visualização simplificada tipo checklist das OS de hoje, rota do dia e preenchimento de status de atendimento.
- **Automação de Mensagens**: Estrutura de dados preparada para Templates de WhatsApp, visando integrações futuras com Z-API ou edfashion.
