const { nomeCookie, responder } = require('./_sessao');

module.exports = function sair(request) {
  if (request.method !== 'POST') return responder(request, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return responder(request, 200, { ok: true }, {
    'Set-Cookie': `${nomeCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${seguro}`
  });
};
