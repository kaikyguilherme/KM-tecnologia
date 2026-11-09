const crypto = require('node:crypto');
const { criarCookie, responder } = require('./_sessao');

function iguaisSemVazarTempo(valorA, valorB) {
  const hashA = crypto.createHash('sha256').update(valorA).digest();
  const hashB = crypto.createHash('sha256').update(valorB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

module.exports = async function entrar(request, response) {
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'POST, OPTIONS' });
  if (request.method !== 'POST') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });

  const emailAutorizado = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senhaAutorizada = process.env.ADMIN_PASSWORD || '';
  if (!emailAutorizado || senhaAutorizada.length < 12 || !process.env.KM_SESSION_SECRET) {
    console.error('Configure ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 12 caracteres) e KM_SESSION_SECRET no ambiente.');
    return responder(response, 503, { erro: 'O acesso administrativo ainda não está configurado.' });
  }

  let dados;
  try {
    dados = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch (erro) {
    if (erro instanceof SyntaxError) return responder(response, 400, { erro: 'Dados de entrada inválidos.' });
    throw erro;
  }

  const email = String(dados?.email || '').trim().toLowerCase();
  const senha = String(dados?.senha || '');
  if (email !== emailAutorizado || !iguaisSemVazarTempo(senha, senhaAutorizada)) {
    return responder(response, 401, { erro: 'E-mail ou senha incorretos.' });
  }

  try {
    return responder(response, 200, { email }, { 'Set-Cookie': criarCookie(email) });
  } catch (erro) {
    console.error('Falha ao criar sessão administrativa.', erro);
    return responder(response, 503, { erro: 'Não foi possível iniciar a sessão.' });
  }
};
