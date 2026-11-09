# Configuração do acesso administrativo

O painel administrativo usa funções do Vercel e uma sessão assinada pelo servidor. Não coloque senhas ou chaves em arquivos HTML, CSS ou JavaScript.

No projeto do Vercel, adicione estas variáveis em **Settings → Environment Variables**:

| Variável | Valor |
| --- | --- |
| `ADMIN_EMAIL` | `kaiky.mesquita12@gmail.com` |
| `ADMIN_PASSWORD` | Uma senha nova, forte e com pelo menos 12 caracteres |
| `KM_SESSION_SECRET` | Um segredo aleatório com pelo menos 32 caracteres |

Gere o segredo de sessão no terminal com:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Salve os valores como variáveis privadas do projeto Vercel e faça um novo deploy para aplicá-las. Não compartilhe nem publique a senha ou o segredo. Como a senha mencionada anteriormente foi enviada em uma conversa, escolha outra senha para a implantação.

Depois do deploy, abra `https://SEU-DOMINIO/admin-login.html` para entrar. As sessões expiram após oito horas e usam cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.

## Limite atual dos pedidos

A autenticação restringe o painel, mas a lista de solicitações ainda usa armazenamento local do navegador. Para ver solicitações feitas pelos clientes em outros dispositivos, conecte o fluxo a um banco de dados ou Google Sheets por meio de uma função do servidor. Não use o armazenamento local atual como histórico compartilhado.
