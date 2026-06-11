# Plataforma Dental

Plataforma web mobile-first para a venda consultiva de equipamentos odontológicos e gestão de ordens de serviço/assistência técnica de clínicas e consultórios odontológicos.

## Requisitos Prévios

- Node.js (v18.x ou superior)
- npm (v9.x ou superior)

## Instalação de Dependências

Para instalar as dependências do projeto, execute no terminal da raiz:

```bash
npm install
```

## Configuração de Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto copiando as variáveis do `.env.example`:

```bash
cp .env.example .env.local
```

Preencha os valores das variáveis com as suas credenciais correspondentes:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta de administração do Supabase (NUNCA expor no frontend).
- `ZAPI_INSTANCE_ID`: ID da instância do WhatsApp via Z-API.
- `ZAPI_TOKEN`: Token da instância Z-API.
- `ZAPI_CLIENT_TOKEN`: Token do cliente Z-API.
- `ZAPI_SEND_ENABLED`: Mantenha como `false` em desenvolvimento local.
- `WHATSAPP_PROVIDER`: Provedor ativo (`zapi` ou `edfashion`).
- `NEXT_PUBLIC_APP_URL`: URL base do frontend.

## Execução em Desenvolvimento Local

Para iniciar o servidor de desenvolvimento local:

```bash
npm run dev
```

Acesse em seu navegador: `http://localhost:3000`

## Banco de Dados e Migrações (Supabase)

Para aplicar o esquema inicial de banco de dados na sua instância do Supabase:

1. Acesse o painel do [Supabase](https://supabase.com/).
2. Vá em **SQL Editor** no painel lateral esquerdo.
3. Clique em **New Query**.
4. Copie o conteúdo do arquivo localizado em `supabase/migrations/001_initial_schema.sql` e cole no editor de SQL.
5. Clique em **Run** no canto inferior direito para aplicar.

## Fluxo de Trabalho Git (Dois Computadores)

Para garantir sincronia e evitar conflitos ao trabalhar no mesmo projeto usando múltiplos computadores, siga este fluxo:

1. **Antes de iniciar o desenvolvimento**:
   Sempre faça o download das últimas alterações do repositório remoto:
   ```bash
   git pull origin main
   ```
2. **Durante o desenvolvimento**:
   Trabalhe normalmente nos arquivos e crie as rotas/componentes.
3. **Ao finalizar o dia / lote de trabalho**:
   Adicione e salve suas modificações localmente, depois envie-as ao repositório:
   ```bash
   git add .
   git commit -m "feat: descrição da alteração realizada"
   git push origin main
   ```

## Implantação do Protótipo (Vercel)

O protótipo da Plataforma Dental foi implantado com sucesso no **Vercel** para fins de homologação e demonstração sem necessidade de execução local.

* **URL de Produção**: `https://plataforma-dental-pi.vercel.app`
* **Repositório**: `cardoso1967-lab/plataforma-dental`
* **Branch**: `main`
* **Status**: Protótipo online e disponível para apresentação.

### Configuração de Variáveis de Ambiente no Vercel

As seguintes variáveis de ambiente foram configuradas no painel do projeto no Vercel:

* `NEXT_PUBLIC_SUPABASE_URL`: URL pública da instância do Supabase.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.
* `ZAPI_SEND_ENABLED`: Configurada como `false` (WhatsApp inativo por segurança neste protótipo).
* `WHATSAPP_PROVIDER`: Definida como `zapi`.
* `NEXT_PUBLIC_APP_URL`: URL final de produção (`https://plataforma-dental-pi.vercel.app`).

> [!IMPORTANT]
> * Não foi adicionada a chave administrativa `SUPABASE_SERVICE_ROLE_KEY` nas variáveis do Vercel para garantir a segurança dos dados.

### Configuração do Supabase Auth (Redirecionamentos)

No painel do Supabase, em **Authentication** > **URL Configuration**, as seguintes URLs foram configuradas:

* **Site URL**: `https://plataforma-dental-pi.vercel.app`
* **Redirect / Callback URL**: `https://plataforma-dental-pi.vercel.app/api/auth/callback`

*(Nota: Caso um domínio personalizado seja configurado futuramente utilizando Cloudflare DNS, devem ser adicionados também `https://seu-dominio-customizado.com` e `https://seu-dominio-customizado.com/api/auth/callback` no Supabase).*

## Seed de Demonstração (Dados para Apresentação)

> [!WARNING]
> Este seed é exclusivo para fins de demonstração e apresentação do protótipo. NÃO aplicar em ambiente de produção com dados reais.

Para popular o banco de dados com dados de demonstração e tornar as telas do protótipo visualmente completas durante uma apresentação, aplique o seed disponível em:

```txt
supabase/seeds/demo_prototype_data.sql
```

### Como Aplicar o Seed

1. Acesse o painel do [Supabase](https://supabase.com).
2. Selecione o projeto da Plataforma Dental.
3. Vá em **SQL Editor** no painel lateral esquerdo.
4. Clique em **New Query**.
5. Copie e cole o conteúdo do arquivo `supabase/seeds/demo_prototype_data.sql`.
6. Clique em **Run**.

### Dados Incluídos no Seed

| Tabela | Registros Demo |
|---|---|
| `products` | 6 produtos (cadeira, compressor, autoclave, fotopolimerizador, ultrassom, bomba de vácuo) |
| `parts` | 5 peças de reposição (válvula, filtro, mangueira, placa eletrônica, kit vedação) |
| `customers` | 4 clínicas demo (Sorriso Prime, Odonto Center Norte, Dental Vida, Dental Avançada) |
| `client_equipment` | 7 equipamentos instalados |
| `sales_orders` | 4 pedidos de venda (faturado, aprovado, pendente) |
| `service_orders` | 6 ordens de serviço distribuídas por status |
| `service_quotes` | 1 orçamento enviado aguardando aprovação |
| `appointments` | 3 agendamentos (2 hoje, 1 amanhã) |

### Telas Populadas pelo Seed

* `/admin/dashboard` — Métricas reais de OS, técnicos e faturamento
* `/admin/clientes` — Lista de clínicas com dados completos
* `/admin/agenda` — Kanban de OS distribuído por status
* `/admin/relatorios` — Dados para análise gerencial
* `/cliente/dashboard` — Portal com dados de chamados do `cliente@dental.com`
* `/cliente/pedidos` — Histórico de compras do cliente
* `/cliente/equipamentos` — Equipamentos instalados na clínica
* `/cliente/suporte` — OS ativa com timeline de progresso
* `/tecnico/dashboard` — OS ativa e visita de hoje
* `/tecnico/servicos` — Fila de serviços atribuídos
* `/tecnico/agenda` — Agendamentos de hoje e amanhã

### Segurança do Seed

* Idempotente: pode ser executado múltiplas vezes sem criar duplicatas.
* Sem cláusulas `TRUNCATE`, `DELETE`, `DROP`, `ALTER TABLE` ou `CREATE TABLE`.
* Sem alteração de RLS, enums ou schema.
* Não cria usuários `auth.users` diretamente.
* WhatsApp permanece desabilitado.
