// Publica e lista avaliações; a política RLS do banco controla quem pode inserir.
const { statusErro, supabaseFetch } = require('../lib/supabase');
const { enviarJson, lerCorpo, sessaoCliente } = require('../lib/cliente-sessao');

module.exports = async function feedback(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET, POST' });
  }
  try {
    if (request.method === 'GET') {
      const feedbacks = await supabaseFetch('rest/v1/feedbacks?select=id,order_id,user_name,rating,comment,created_at&order=created_at.desc');
      return enviarJson(response, 200, { feedbacks });
    }

    const session = await sessaoCliente(request, response);
    if (!session) return enviarJson(response, 401, { erro: 'Entre na sua conta para publicar um feedback.' });
    const dados = lerCorpo(request);
    const pedidoId = String(dados.pedidoId || '');
    const nota = Number(dados.nota);
    const comentario = String(dados.comentario || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(pedidoId) || !Number.isInteger(nota) || nota < 1 || nota > 5
        || !comentario || comentario.length > 600) {
      return enviarJson(response, 400, { erro: 'Os dados do feedback são inválidos.' });
    }

    const pedidos = await supabaseFetch(
      `rest/v1/orders?select=id,items&id=eq.${encodeURIComponent(pedidoId)}&user_id=eq.${encodeURIComponent(session.user.id)}&status=eq.${encodeURIComponent('Concluído')}`,
      { accessToken: session.access_token }
    );
    if (!pedidos.length || !pedidos[0].items.some(item => item.tipo === 'servico')) {
      return enviarJson(response, 403, { erro: 'Só é possível avaliar um serviço concluído da sua conta.' });
    }

    const inserido = await supabaseFetch('rest/v1/feedbacks?select=id,order_id,user_name,rating,comment,created_at', {
      method: 'POST',
      accessToken: session.access_token,
      headers: { Prefer: 'return=representation' },
      body: {
        order_id: pedidoId,
        user_id: session.user.id,
        user_name: String(session.user.user_metadata?.full_name || '').trim().slice(0, 120) || 'Cliente',
        rating: nota,
        comment: comentario
      }
    });
    return enviarJson(response, 201, { feedback: inserido[0] });
  } catch (erro) {
    console.error('Falha ao acessar feedbacks no Supabase.', erro);
    return enviarJson(response, erro instanceof SyntaxError ? 400 : statusErro(erro), {
      erro: erro instanceof SyntaxError ? 'Dados de entrada inválidos.' : erro.message
    });
  }
};
