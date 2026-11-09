// Cria pedidos autenticados e lista somente os pedidos da conta solicitante.
const { statusErro, supabaseFetch } = require('../lib/supabase');
const { enviarJson, lerCorpo, sessaoCliente } = require('../lib/cliente-sessao');

function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length < 1 || itens.length > 50) return null;
  const normalizados = [];
  for (const item of itens) {
    const nome = String(item?.nome || '').trim().slice(0, 120);
    const quantidade = Number(item?.quantidade);
    const tipo = item?.tipo;
    if (!nome || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 25
        || !['produto', 'servico'].includes(tipo)) return null;
    normalizados.push({
      id: String(item.id || '').slice(0, 160),
      nome,
      opcao: String(item.opcao || '').trim().slice(0, 120),
      quantidade,
      tipo
    });
  }
  return normalizados;
}

module.exports = async function pedidos(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'GET, POST' });
  }
  try {
    const session = await sessaoCliente(request, response);
    if (!session) return enviarJson(response, 401, { erro: 'Entre na sua conta para acessar os pedidos.' });

    if (request.method === 'GET') {
      const lista = await supabaseFetch(`rest/v1/orders?select=*&user_id=eq.${encodeURIComponent(session.user.id)}&order=created_at.desc`, {
        accessToken: session.access_token
      });
      return enviarJson(response, 200, { pedidos: lista });
    }

    const dados = lerCorpo(request);
    const itens = validarItens(dados.itens);
    if (!itens) return enviarJson(response, 400, { erro: 'Os itens do pedido são inválidos.' });
    const pedido = {
      user_id: session.user.id,
      user_name: String(session.user.user_metadata?.full_name || '').trim().slice(0, 120) || 'Cliente',
      user_email: session.user.email,
      order_type: itens.some(item => item.tipo === 'servico') ? 'Serviço' : 'Produto',
      status: 'Aguardando contato',
      items: itens
    };
    const criado = await supabaseFetch('rest/v1/orders?select=*', {
      method: 'POST',
      accessToken: session.access_token,
      headers: { Prefer: 'return=representation' },
      body: pedido
    });
    return enviarJson(response, 201, { pedido: criado[0] });
  } catch (erro) {
    console.error('Falha ao acessar pedidos no Supabase.', erro);
    return enviarJson(response, erro instanceof SyntaxError ? 400 : statusErro(erro), {
      erro: erro instanceof SyntaxError ? 'Dados de entrada inválidos.' : erro.message
    });
  }
};
