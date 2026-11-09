// Reutiliza a validação do cookie e o formato comum das respostas da API.
// Funções compartilhadas para validar a sessão e responder à requisição.
const { emailDaSessao, responder } = require('./_sessao');

// Informa ao cliente se a requisição atual possui uma sessão válida.
module.exports = function consultarSessao(request, response) {
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'GET, OPTIONS' });
  if (request.method !== 'GET') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET, OPTIONS' });
  // Um e-mail presente indica sessão válida; caso contrário, responde 401.
  // Identidade extraída de um cookie assinado e ainda válido.
  const email = emailDaSessao(request);
  return email
    ? responder(response, 200, { autenticado: true, email })
    : responder(response, 401, { autenticado: false });
};
