// Cria uma conta de cliente usando Supabase Auth e abre sessão quando permitido.
const { statusErro, supabaseFetch } = require('../../lib/supabase');
const { cookieSessao, enviarJson, lerCorpo, usuarioPublico } = require('../../lib/cliente-sessao');

module.exports = async function cadastrar(request, response) {
  if (request.method !== 'POST') return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });
  try {
    const dados = lerCorpo(request);
    const nome = String(dados.nome || '').trim();
    const email = String(dados.email || '').trim().toLowerCase();
    const senha = String(dados.senha || '');
    if (nome.length < 2 || !email || senha.length < 6) {
      return enviarJson(response, 400, { erro: 'Informe nome, e-mail válido e senha com pelo menos 6 caracteres.' });
    }

    const resultado = await supabaseFetch('auth/v1/signup', {
      method: 'POST',
      body: { email, password: senha, data: { full_name: nome } }
    });
    if (!resultado.access_token || !resultado.refresh_token || !resultado.user) {
      return enviarJson(response, 200, { confirmacaoNecessaria: true });
    }

    const session = {
      access_token: resultado.access_token,
      refresh_token: resultado.refresh_token,
      expires_at: resultado.expires_at || Math.floor(Date.now() / 1000) + resultado.expires_in,
      user: resultado.user
    };
    return enviarJson(response, 201, { usuario: usuarioPublico(session.user) }, { 'Set-Cookie': cookieSessao(session) });
  } catch (erro) {
    console.error('Falha ao criar conta de cliente no Supabase.', erro);
    return enviarJson(response, erro instanceof SyntaxError ? 400 : statusErro(erro), {
      erro: erro instanceof SyntaxError ? 'Dados de entrada inválidos.' : erro.message
    });
  }
};
