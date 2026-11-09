const { emailDaSessao, responder } = require('./_sessao');

module.exports = function consultarSessao(request) {
  if (request.method !== 'GET') return responder(request, 405, { erro: 'Método não permitido.' }, { Allow: 'GET' });
  const email = emailDaSessao(request);
  return email
    ? responder(request, 200, { autenticado: true, email })
    : responder(request, 401, { autenticado: false });
};
