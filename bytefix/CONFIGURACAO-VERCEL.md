# Configuração do Vercel e do Supabase

O site usa funções do Vercel para autenticar clientes pelo Supabase Auth e guardar pedidos e feedbacks no banco. O painel administrativo usa uma sessão separada, assinada pelo servidor. Não coloque senhas ou chaves em arquivos HTML, CSS ou JavaScript.

## Variáveis de ambiente

No projeto do Vercel, configure estas variáveis em **Settings → Environment Variables**, selecionando os ambientes em que o site será publicado:

| Variável | Onde obter / valor |
| --- | --- |
| `SUPABASE_URL` | URL do projeto, em **Supabase → Project Settings → API** |
| `SUPABASE_ANON_KEY` | Chave pública (anon/Publishable) do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada `service_role`/Secret; usada somente pela função administrativa |
| `ADMIN_EMAIL` | E-mail autorizado a entrar no painel administrativo |
| `ADMIN_PASSWORD` | Senha forte do painel, com pelo menos 12 caracteres |
| `KM_SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres |

`SUPABASE_SERVICE_ROLE_KEY` é necessária para o painel listar e concluir pedidos de todos os clientes. Mantenha-a como variável privada do Vercel: nunca use essa chave no navegador, HTML, CSS, JavaScript público ou Git. A chave `SUPABASE_ANON_KEY` é usada somente pelas funções do servidor neste projeto; o acesso às tabelas continua protegido por RLS.

Gere `KM_SESSION_SECRET` no terminal com:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Não compartilhe nem publique senhas ou chaves privadas. Depois de salvar as variáveis, faça um novo deploy para aplicá-las.

## Preparar o banco

1. No Supabase, abra **SQL Editor**, crie uma consulta e execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql). Isso cria `orders` e `feedbacks` com RLS, políticas de acesso e o bucket público de fotos de perfil.
2. Em **Authentication → URL Configuration**, defina `https://km-tecnologia-bytefix.vercel.app` como **Site URL**. Se usar domínio próprio, use o domínio de produção.
3. Decida se a confirmação de e-mail ficará ativa. Se ficar, o cadastro mostra que o cliente precisa confirmar o e-mail antes de entrar.
4. Configure as variáveis no Vercel e faça um novo deploy.

Depois do deploy, teste criar uma conta de cliente, entrar, enviar um pedido e confirmar que ele aparece no painel administrativo em `https://km-tecnologia-bytefix.vercel.app/admin-login.html`. As sessões administrativas expiram após oito horas. A sessão de cliente usa cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

## Dados existentes

Contas, pedidos e feedbacks que já estavam no `localStorage` de navegadores não são migrados automaticamente. Clientes precisam criar uma conta no Supabase Auth; novos pedidos, fotos de perfil e feedbacks serão compartilhados entre dispositivos. O carrinho continua temporário e local ao navegador.
