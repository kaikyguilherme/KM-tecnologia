const crypto = require('node:crypto');
const { criarCookie, responder } = require('./_sessao');

function iguaisSemVazarTempo(valorA, valorB) {
  const hashA = crypto.createHash('sha256').update(valorA).digest();
  const hashB = crypto.createHash('sha256').update(valorB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

module.exports = async function entrar(request) {
  if (request.method === 'OPTIONS') return responder(request, 204, {});
  if (request.method !== 'POST') return responder(request, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });

  const emailAutorizado = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senhaAutorizada = process.env.ADMIN_PASSWORD || '';
  if (!emailAutorizado || senhaAutorizada.length < 12 || !process.env.KM_SESSION_SECRET) {
    console.error('Configure ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 12 caracteres) e KM_SESSION_SECRET no ambiente.');
    return responder(request, 503, { erro: 'O acesso administrativo ainda não está configurado.' });
  }

  let dados;
  try {
    dados = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch (erro) {
    if (erro instanceof SyntaxError) return responder(request, 400, { erro: 'Dados de entrada inválidos.' });
    throw erro;
  }

  const email = String(dados?.email || '').trim().toLowerCase();
  const senha = String(dados?.senha || '');
  if (email !== emailAutorizado || !iguaisSemVazarTempo(senha, senhaAutorizada)) {
    return responder(request, 401, { erro: 'E-mail ou senha incorretos.' });
  }

  try {
    return responder(request, 200, { email }, { 'Set-Cookie': criarCookie(email) });
  } catch (erro) {
    console.error('Falha ao criar sessão administrativa.', erro);
    return responder(request, 503, { erro: 'Não foi possível iniciar a sessão.' });
  }
};
