# Especificações Técnicas (SPECS) — Plataforma Dental

## 1. Stack de Tecnologia

### Frontend & Framework
- **Next.js (v15+)**: Utilizando o **App Router** para roteamento de páginas e componentes, garantindo renderização ágil e otimização para SEO.
- **TypeScript**: Tipagem estática em toda a aplicação para segurança de código.
- **Tailwind CSS (v4)**: Estilização moderna baseada em utilitários diretamente no arquivo `globals.css` via `@theme`, com foco em design clínico premium e mobile-first.

### Backend & Database
- **Supabase**: Backend-as-a-Service (BaaS) gerenciado.
  - **Supabase Auth**: Autenticação segura de usuários.
  - **Supabase Database (PostgreSQL)**: Banco de dados relacional com suporte a tipos personalizados, gatilhos de `updated_at` e Row Level Security (RLS).
  - **Supabase Storage**: Estruturado para uso futuro de fotos de equipamentos em ordens de serviço.

### Integrações
- **Z-API (WhatsApp)**: Configuração e fila prontas para o envio de mensagens transacionais.
- **edfashion (Provedor Secundário)**: Estrutura preparada no banco de dados para fácil substituição de provedor via variável de ambiente `WHATSAPP_PROVIDER`.

---

## 2. Modelagem de Dados e Segurança RLS
Todas as tabelas do PostgreSQL foram criadas sob Row Level Security (RLS) para proteção de dados do consultório. A filtragem de acessos no banco usa funções criadas sob o privilégio `SECURITY DEFINER` para evitar recursão infinita na leitura do perfil (`profiles`):

- `check_is_admin()`: Retorna verdadeiro se o usuário autenticado for administrador.
- `check_is_vendedor()`: Retorna verdadeiro se for vendedor.
- `check_is_soporte()`: Retorna verdadeiro se for do time de suporte operacional.
- `check_is_tecnico()`: Retorna verdadeiro se for técnico de campo.
- `check_is_cliente()`: Retorna verdadeiro se for cliente.
- `get_my_customer_id()`: Resolve o ID do cliente logado.
- `get_my_technician_id()`: Resolve o ID do técnico logado.

---

## 3. Estrutura de Pastas do Projeto
```text
├── public/                  # Arquivos públicos e logos estáticos
├── supabase/
│   └── migrations/          # Migrações SQL da base de dados
└── src/
    ├── app/                 # Páginas e rotas (Next.js App Router)
    │   ├── (public)/        # Grupo de rotas públicas (Header/Footer comuns)
    │   ├── admin/           # Painel de administração
    │   ├── cliente/         # Portal do cliente (mobile first)
    │   └── tecnico/         # Portal do técnico (mobile first, bottom nav)
    ├── components/          # Componentes reutilizáveis de interface
    │   ├── admin/
    │   ├── tecnico/
    │   └── ui/              # StatusCard, MobileButton, ProductCard, etc.
    └── lib/
        └── supabase.ts      # Cliente de inicialização do Supabase
```
