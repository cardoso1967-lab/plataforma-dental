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

O protótipo da Plataforma Dental está preparado para ser implantado na plataforma **Vercel** para fins de homologação e demonstração sem necessidade de execução local.

### Configuração de Variáveis de Ambiente no Vercel

As seguintes variáveis de ambiente devem ser configuradas no painel do projeto no Vercel:

* `NEXT_PUBLIC_SUPABASE_URL`: URL pública da sua instância do Supabase.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.
* `ZAPI_SEND_ENABLED`: Deve ser configurada como `false` (WhatsApp inativo por segurança neste protótipo).
* `WHATSAPP_PROVIDER`: Definida como `zapi`.
* `NEXT_PUBLIC_APP_URL`: A URL final de produção gerada pelo Vercel (ex: `https://plataforma-dental.vercel.app`).

> [!IMPORTANT]
> * Não adicione a chave administrativa `SUPABASE_SERVICE_ROLE_KEY` nas variáveis do Vercel.
> * Após o primeiro deploy bem-sucedido, copie a URL gerada pelo Vercel, atualize a variável `NEXT_PUBLIC_APP_URL` com esse valor e realize um novo deploy para que os links e redirecionamentos funcionem de forma consistente.

### Passos para Implantação Manual no Dashboard do Vercel

Caso a autenticação automática via CLI não seja realizada:

1. Acesse o dashboard do [Vercel](https://vercel.com).
2. Clique em **Add New** > **Project** e importe o repositório Git: `cardoso1967-lab/plataforma-dental`.
3. Escolha o preset de Framework: **Next.js**.
4. Configure o diretório raiz (`Root Directory`) como a raiz do projeto.
5. Comando de Build: `npm run build` (o comando de instalação e diretório de saída utilizam os padrões da Vercel).
6. Expanda a seção **Environment Variables** e adicione as variáveis listadas acima.
7. Clique em **Deploy**.
8. Configure as URLs de redirecionamento no Supabase (conforme seção abaixo).

### Configuração do Supabase Auth (Redirecionamentos)

Após obter a URL final gerada pelo Vercel, acesse o painel do Supabase do seu projeto em **Authentication** > **URL Configuration** e configure:

* **Site URL**: `https://<sua-url-do-vercel>.vercel.app`
* **Redirect / Callback URL**: `https://<sua-url-do-vercel>.vercel.app/api/auth/callback`

*(Nota: Caso um domínio personalizado seja configurado posteriormente utilizando Cloudflare DNS, configure também `https://seu-dominio-customizado.com` e `https://seu-dominio-customizado.com/api/auth/callback` no Supabase).*
