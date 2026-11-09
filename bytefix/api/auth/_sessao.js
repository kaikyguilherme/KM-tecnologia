const crypto = require('node:crypto');

const duracaoSessaoSegundos = 8 * 60 * 60;
const nomeCookie = 'km_admin_sessao';

function segredoSessao() {
  const segredo = process.env.KM_SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error('KM_SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  }
  return segredo;
}

function codificar(valor) {
  return Buffer.from(valor).toString('base64url');
}

function assinatura(conteudo) {
  return crypto.createHmac('sha256', segredoSessao()).update(conteudo).digest('base64url');
}

function criarCookie(email) {
  const carga = codificar(JSON.stringify({
    email,
    expira: Math.floor(Date.now() / 1000) + duracaoSessaoSegundos
  }));
  const token = `${carga}.${assinatura(carga)}`;
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${nomeCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${duracaoSessaoSegundos}${seguro}`;
}

function lerCookie(cabecalho) {
  const cookies = Object.fromEntries(
    (cabecalho || '').split(';').map(parte => {
      const separador = parte.indexOf('=');
      return separador < 0
        ? ['', '']
        : [parte.slice(0, separador).trim(), parte.slice(separador + 1).trim()];
    }).filter(([nome]) => nome)
  );
  return cookies[nomeCookie] || '';
}

function emailDaSessao(request) {
  const token = lerCookie(request.headers.cookie);
  const separador = token.lastIndexOf('.');
  if (separador < 1) return null;

  const carga = token.slice(0, separador);
  const assinaturaRecebida = Buffer.from(token.slice(separador + 1));
  const assinaturaEsperada = Buffer.from(assinatura(carga));
  if (assinaturaRecebida.length !== assinaturaEsperada.length
      || !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada)) return null;

  try {
    const sessao = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8'));
    const emailAutorizado = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (sessao.email !== emailAutorizado || sessao.expira <= Math.floor(Date.now() / 1000)) return null;
    return sessao.email;
  } catch (erro) {
    if (erro instanceof SyntaxError) return null;
    throw erro;
  }
}

function responder(request, status, dados, cabecalhos = {}) {
  if (request.method === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'GET, POST, OPTIONS', ...cabecalhos }, body: '' };
  }
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabecalhos },
    body: JSON.stringify(dados)
  };
}

module.exports = { criarCookie, emailDaSessao, nomeCookie, responder };
