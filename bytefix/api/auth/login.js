// Usa comparação de senha com tempo de execução uniforme para reduzir vazamento temporal.
// Módulo criptográfico nativo usado para criar hashes e fazer comparação segura.
const crypto = require('node:crypto');
// Reutiliza a criação de cookie e a resposta HTTP padronizada.
const { criarCookie, responder } = require('./_sessao');

// Compara os dois valores por hashes de tamanho fixo em tempo constante.
function iguaisSemVazarTempo(valorA, valorB) {
  // Hashes de tamanho constante dos valores recebidos e armazenados.
  const hashA = crypto.createHash('sha256').update(valorA).digest();
  const hashB = crypto.createHash('sha256').update(valorB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Valida as credenciais administrativas e abre uma sessão autenticada.
module.exports = async function entrar(request, response) {
  // Trata preflight e rejeita métodos diferentes de POST.
  if (request.method === 'OPTIONS') return responder(response, 204, {}, { Allow: 'POST, OPTIONS' });
  if (request.method !== 'POST') return responder(response, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });

  // Carrega do ambiente do servidor as credenciais e valida sua configuração básica.
  // Credenciais administrativas privadas, não enviadas ao código do navegador.
  const emailAutorizado = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senhaAutorizada = process.env.ADMIN_PASSWORD || '';
  if (!emailAutorizado || senhaAutorizada.length < 12 || !process.env.KM_SESSION_SECRET) {
    console.error('Configure ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 12 caracteres) e KM_SESSION_SECRET no ambiente.');
    return responder(response, 503, { erro: 'O acesso administrativo ainda não está configurado.' });
  }

  // Converte o corpo da requisição para objeto quando o runtime o entrega como texto.
  // Objeto com os campos enviados pelo formulário.
  let dados;
  try {
    dados = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  } catch (erro) {
    if (erro instanceof SyntaxError) return responder(response, 400, { erro: 'Dados de entrada inválidos.' });
    throw erro;
  }

  // Normaliza o e-mail e obtém a senha enviada pelo formulário.
  // Valores fornecidos pelo usuário para comparação com as credenciais autorizadas.
  const email = String(dados?.email || '').trim().toLowerCase();
  const senha = String(dados?.senha || '');
  if (email !== emailAutorizado || !iguaisSemVazarTempo(senha, senhaAutorizada)) {
    return responder(response, 401, { erro: 'E-mail ou senha incorretos.' });
  }

  // Emite o cookie assinado apenas após a validação das credenciais.
  try {
    return responder(response, 200, { email }, { 'Set-Cookie': criarCookie(email) });
  } catch (erro) {
    console.error('Falha ao criar sessão administrativa.', erro);
    return responder(response, 503, { erro: 'Não foi possível iniciar a sessão.' });
  }
};
