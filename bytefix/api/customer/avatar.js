// Armazena a foto do cliente no Supabase Storage e vincula a URL ao perfil Auth.
const { SupabaseError, configuracaoSupabase, statusErro, supabaseFetch } = require('../../lib/supabase');
const { cookieSessao, enviarJson, lerCorpo, sessaoCliente, usuarioPublico } = require('../../lib/cliente-sessao');

module.exports = async function atualizarAvatar(request, response) {
  if (request.method !== 'PUT') return enviarJson(response, 405, { erro: 'Método não permitido.' }, { Allow: 'PUT' });
  try {
    const session = await sessaoCliente(request, response);
    if (!session) return enviarJson(response, 401, { erro: 'Entre na sua conta para alterar a foto.' });
    const dados = lerCorpo(request);
    const imagem = String(dados.imagem || '');
    const correspondencia = imagem.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!correspondencia) return enviarJson(response, 400, { erro: 'Envie uma imagem PNG, JPEG ou WebP válida.' });

    const conteudo = Buffer.from(correspondencia[2], 'base64');
    if (!conteudo.length || conteudo.length > 1024 * 1024) {
      return enviarJson(response, 400, { erro: 'A imagem deve ter no máximo 1 MB.' });
    }

    const { url, chave } = configuracaoSupabase();
    const upload = await fetch(`${url}/storage/v1/object/avatars/${encodeURIComponent(session.user.id)}`, {
      method: 'PUT',
      headers: {
        apikey: chave,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': correspondencia[1],
        'x-upsert': 'true'
      },
      body: conteudo
    });
    if (!upload.ok) {
      const detalhe = await upload.text();
      throw new SupabaseError(upload.status, detalhe || 'Não foi possível salvar a foto no Supabase Storage.');
    }

    const avatarUrl = `${url}/storage/v1/object/public/avatars/${encodeURIComponent(session.user.id)}?v=${Date.now()}`;
    const user = await supabaseFetch('auth/v1/user', {
      method: 'PUT',
      accessToken: session.access_token,
      body: { data: { ...session.user.user_metadata, avatar_url: avatarUrl } }
    });
    const sessaoNova = { ...session, user };
    return enviarJson(response, 200, { usuario: usuarioPublico(user) }, { 'Set-Cookie': cookieSessao(sessaoNova) });
  } catch (erro) {
    console.error('Falha ao atualizar foto de perfil no Supabase.', erro);
    return enviarJson(response, erro instanceof SyntaxError ? 400 : statusErro(erro), {
      erro: erro instanceof SyntaxError ? 'Dados de entrada inválidos.' : erro.message
    });
  }
};
