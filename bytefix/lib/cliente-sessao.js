// Cookie assinado que mantém a sessão Supabase fora do alcance do JavaScript.
const crypto = require('node:crypto');
const { SupabaseError, supabaseFetch } = require('./supabase');

const nomeCookieCliente = 'km_cliente_sessao';
const duracaoCookieSegundos = 30 * 24 * 60 * 60;

function assinar(carga) {
  const segredo = process.env.KM_SESSION_SECRET;
  if (!segredo || segredo.length < 32) throw new Error('KM_SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  return crypto.createHmac('sha256', segredo).update(carga).digest('base64url');
}

function cookieSessao(session) {
  const carga = Buffer.from(JSON.stringify(session)).toString('base64url');
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${nomeCookieCliente}=${carga}.${assinar(carga)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${duracaoCookieSegundos}${seguro}`;
}

function apagarCookie(response) {
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${nomeCookieCliente}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${seguro}`);
}

function lerSessao(request) {
  const cookies = Object.fromEntries((request.headers.cookie || '').split(';').map(parte => {
    const separador = parte.indexOf('=');
    return separador < 0
      ? ['', '']
      : [parte.slice(0, separador).trim(), parte.slice(separador + 1).trim()];
  }).filter(([nome]) => nome));
  const token = cookies[nomeCookieCliente] || '';
  const separador = token.lastIndexOf('.');
  if (separador < 1) return null;

  const carga = token.slice(0, separador);
  const recebida = Buffer.from(token.slice(separador + 1));
  const esperada = Buffer.from(assinar(carga));
  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) return null;

  try {
    const session = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8'));
    return session?.user?.id && session?.access_token && session?.refresh_token ? session : null;
  } catch (erro) {
    if (erro instanceof SyntaxError) return null;
    throw erro;
  }
}

async function sessaoCliente(request, response) {
  const session = lerSessao(request);
  if (!session) return null;
  if (Number(session.expires_at) > Math.floor(Date.now() / 1000) + 60) return session;

  try {
    const atualizada = await supabaseFetch('auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    });
    const sessaoNova = {
      access_token: atualizada.access_token,
      refresh_token: atualizada.refresh_token,
      expires_at: atualizada.expires_at || Math.floor(Date.now() / 1000) + atualizada.expires_in,
      user: atualizada.user
    };
    response.setHeader('Set-Cookie', cookieSessao(sessaoNova));
    return sessaoNova;
  } catch (erro) {
    if (erro instanceof SupabaseError && erro.status >= 400 && erro.status < 500) {
      apagarCookie(response);
      return null;
    }
    throw erro;
  }
}

function usuarioPublico(user) {
  return {
    id: user.id,
    email: user.email,
    nome: user.user_metadata?.full_name || user.user_metadata?.name || '',
    foto: user.user_metadata?.avatar_url || ''
  };
}

function enviarJson(response, status, dados, cabecalhos = {}) {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(cabecalhos).forEach(([nome, valor]) => response.setHeader(nome, valor));
  response.end(JSON.stringify(dados));
}

function lerCorpo(request) {
  if (typeof request.body === 'string') return JSON.parse(request.body);
  return request.body || {};
}

module.exports = {
  apagarCookie,
  cookieSessao,
  enviarJson,
  lerCorpo,
  nomeCookieCliente,
  sessaoCliente,
  usuarioPublico
};
