const { emailDaSessao, responder } = require('./_sessao');

module.exports = function consultarSessao(request, response) {
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'GET, OPTIONS' });
  if (request.method !== 'GET') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET, OPTIONS' });
  const email = emailDaSessao(request);
  return email
    ? responder(response, 200, { autenticado: true, email })
    : responder(response, 401, { autenticado: false });
};
