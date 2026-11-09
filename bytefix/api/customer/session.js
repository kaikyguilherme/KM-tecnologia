// Retorna a identidade pública associada ao cookie de sessão do cliente.
const { enviarJson, sessaoCliente, usuarioPublico } = require('../../lib/cliente-sessao');

module.exports = async function consultarSessaoCliente(request, response) {
  if (request.method !== 'GET') return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET' });
  try {
    const session = await sessaoCliente(request, response);
    if (!session) return enviarJson(response, 401, { autenticado: false });
    return enviarJson(response, 200, { autenticado: true, usuario: usuarioPublico(session.user) });
  } catch (erro) {
    console.error('Falha ao consultar sessão de cliente.', erro);
    return enviarJson(response, 502, { erro: 'Não foi possível validar a sessão no Supabase.' });
  }
};
