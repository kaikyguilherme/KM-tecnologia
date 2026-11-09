// Valida as credenciais do cliente pelo Supabase Auth e guarda os tokens em cookie HttpOnly.
const { statusErro, supabaseFetch } = require('../../lib/supabase');
const { cookieSessao, enviarJson, lerCorpo, usuarioPublico } = require('../../lib/cliente-sessao');

module.exports = async function entrar(request, response) {
  if (request.method !== 'POST') return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });
  try {
    const dados = lerCorpo(request);
    const email = String(dados.email || '').trim().toLowerCase();
    const senha = String(dados.senha || '');
    if (!email || !senha) return enviarJson(response, 400, { erro: 'Informe e-mail e senha.' });

    const resultado = await supabaseFetch('auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email, password: senha }
    });
    const session = {
      access_token: resultado.access_token,
      refresh_token: resultado.refresh_token,
      expires_at: resultado.expires_at || Math.floor(Date.now() / 1000) + resultado.expires_in,
      user: resultado.user
    };
    return enviarJson(response, 200, { usuario: usuarioPublico(session.user) }, { 'Set-Cookie': cookieSessao(session) });
  } catch (erro) {
    console.error('Falha no login de cliente pelo Supabase.', erro);
    const mensagem = erro instanceof SyntaxError ? 'Dados de entrada inválidos.'
      : erro.status === 400 || erro.status === 401 ? 'E-mail ou senha incorretos.'
        : erro.message;
    return enviarJson(response, erro instanceof SyntaxError ? 400 : statusErro(erro), { erro: mensagem });
  }
};
