const { nomeCookie, responder } = require('./_sessao');

module.exports = function sair(request, response) {
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'POST, OPTIONS' });
  if (request.method !== 'POST') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return responder(response, 200, { ok: true }, {
    'Set-Cookie': `${nomeCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${seguro}`
  });
};
