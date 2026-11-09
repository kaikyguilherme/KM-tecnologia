// Compartilha o nome do cookie e a resposta HTTP padrão da autenticação.
// Nome do cookie de sessão e helper que envia a resposta HTTP.
const { nomeCookie, responder } = require('./_sessao');

// Encerra a sessão apagando o cookie administrativo no navegador.
module.exports = function sair(request, response) {
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'POST, OPTIONS' });
  if (request.method !== 'POST') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });
  // Reaplica Secure em produção para expirar o mesmo cookie seguro criado no login.
  // Sufixo necessário para apagar o cookie também em conexão HTTPS.
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return responder(response, 200, { ok: true }, {
    'Set-Cookie': `${nomeCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${seguro}`
  });
};
