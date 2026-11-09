// Revoga a sessão do cliente no Supabase e expira o cookie HttpOnly no navegador.
const { statusErro, supabaseFetch } = require('../../lib/supabase');
const { apagarCookie, enviarJson, sessaoCliente } = require('../../lib/cliente-sessao');

module.exports = async function sair(request, response) {
  if (request.method !== 'POST') return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });
  try {
    const session = await sessaoCliente(request, response);
    if (session) {
      await supabaseFetch('auth/v1/logout', { method: 'POST', accessToken: session.access_token });
    }
    apagarCookie(response);
    return enviarJson(response, 200, { ok: true });
  } catch (erro) {
    console.error('Falha ao revogar sessão de cliente no Supabase.', erro);
    apagarCookie(response);
    return enviarJson(response, statusErro(erro), { erro: 'A sessão local foi encerrada, mas não foi possível confirmar a revogação no Supabase.' });
  }
};
