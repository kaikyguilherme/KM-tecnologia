// Centraliza chamadas REST ao Supabase sem expor chaves privadas ao navegador.
class SupabaseError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'SupabaseError';
    this.status = status;
  }
}

function configuracaoSupabase(chavePrivada = false) {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const chave = chavePrivada ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY;
  if (!url || !chave) {
    throw new Error(chavePrivada
      ? 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.'
      : 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no ambiente do servidor.');
  }
  return { url, chave };
}

async function supabaseFetch(caminho, opcoes = {}) {
  const { url, chave } = configuracaoSupabase(Boolean(opcoes.serviceRole));
  const cabecalhos = {
    apikey: chave,
    Authorization: `Bearer ${opcoes.accessToken || chave}`,
    ...opcoes.headers
  };
  if (opcoes.body !== undefined) cabecalhos['Content-Type'] = 'application/json';
  const resposta = await fetch(`${url}/${caminho.replace(/^\/+/, '')}`, {
    method: opcoes.method || 'GET',
    headers: cabecalhos,
    body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body)
  });
  const texto = await resposta.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch (erro) {
      throw new SupabaseError(resposta.status, 'O Supabase retornou uma resposta inválida.');
    }
  }
  if (!resposta.ok) {
    const mensagem = dados?.msg || dados?.message || dados?.error_description || dados?.error || 'Falha ao consultar o Supabase.';
    throw new SupabaseError(resposta.status, mensagem);
  }
  return dados;
}

function statusErro(erro) {
  return erro instanceof SupabaseError && erro.status >= 400 && erro.status < 500 ? 400 : 502;
}

module.exports = { SupabaseError, configuracaoSupabase, statusErro, supabaseFetch };
