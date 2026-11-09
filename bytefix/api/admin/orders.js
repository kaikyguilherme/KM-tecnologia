// Permite que somente a sessão administrativa consulte e conclua pedidos globais.
const { emailDaSessao, responder } = require('../auth/_sessao');
const { supabaseFetch } = require('../../lib/supabase');

function dadosRequisicao(request) {
  return typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {};
}

module.exports = async function pedidosAdmin(request, response) {
  if (!['GET', 'PATCH'].includes(request.method)) {
    return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET, PATCH' });
  }
  try {
    if (!emailDaSessao(request)) return responder(response, 401, { erro: 'Acesso administrativo necessário.' });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return responder(response, 503, { erro: 'Configure SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.' });
    }

    if (request.method === 'GET') {
      const pedidos = await supabaseFetch(`rest/v1/orders?select=*&order_type=eq.${encodeURIComponent('Serviço')}&order=created_at.desc&limit=500`, { serviceRole: true });
      return responder(response, 200, { pedidos });
    }

    const dados = dadosRequisicao(request);
    const id = String(dados.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id) || dados.status !== 'Concluído') {
      return responder(response, 400, { erro: 'Pedido ou status inválido.' });
    }
    const atualizados = await supabaseFetch(`rest/v1/orders?id=eq.${encodeURIComponent(id)}&order_type=eq.${encodeURIComponent('Serviço')}&select=*`, {
      method: 'PATCH',
      serviceRole: true,
      headers: { Prefer: 'return=representation' },
      body: { status: 'Concluído', completed_at: new Date().toISOString() }
    });
    if (!atualizados.length) return responder(response, 404, { erro: 'Pedido não encontrado.' });
    return responder(response, 200, { pedido: atualizados[0] });
  } catch (erro) {
    console.error('Falha ao acessar pedidos administrativos no Supabase.', erro);
    return responder(response, erro instanceof SyntaxError ? 400 : 502, {
      erro: erro instanceof SyntaxError ? 'Dados de entrada inválidos.' : 'Não foi possível acessar os pedidos no Supabase.'
    });
  }
};
