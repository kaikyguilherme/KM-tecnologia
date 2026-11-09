// Reúne utilitários compartilhados pelas funções de sessão administrativa.
// Biblioteca nativa do Node usada para gerar hashes, assinaturas e comparação segura.
const crypto = require('node:crypto');

// Mantém a sessão válida por oito horas.
const duracaoSessaoSegundos = 8 * 60 * 60;
// Nome do cookie usado para identificar a sessão assinada.
const nomeCookie = 'km_admin_sessao';

// Lê e valida o segredo privado usado para assinar os tokens.
function segredoSessao() {
  // Segredo configurado exclusivamente no ambiente privado do servidor.
  const segredo = process.env.KM_SESSION_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error('KM_SESSION_SECRET precisa ter pelo menos 32 caracteres.');
  }
  return segredo;
}

// Converte um valor para Base64 URL-safe, formato usado dentro do token.
function codificar(valor) {
  return Buffer.from(valor).toString('base64url');
}

// Cria uma assinatura HMAC que protege o conteúdo do token contra alterações.
function assinatura(conteudo) {
  return crypto.createHmac('sha256', segredoSessao()).update(conteudo).digest('base64url');
}

// Gera o cookie HttpOnly com o e-mail e o horário de expiração da sessão.
function criarCookie(email) {
  // Armazena os dados mínimos da sessão e o limite de validade.
  // A carga assinada inclui a identidade autorizada e o instante de expiração.
  const carga = codificar(JSON.stringify({
    email,
    expira: Math.floor(Date.now() / 1000) + duracaoSessaoSegundos
  }));
  // Combina os dados assinados e habilita Secure somente em produção.
  // O token contém a carga serializada e sua assinatura criptográfica.
  const token = `${carga}.${assinatura(carga)}`;
  // Impede o envio do cookie em conexões não HTTPS no ambiente de produção.
  const seguro = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${nomeCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${duracaoSessaoSegundos}${seguro}`;
}

// Extrai o cookie administrativo do cabeçalho HTTP recebido.
function lerCookie(cabecalho) {
  // Converte os pares nome=valor do cabeçalho em um objeto pesquisável.
  // O mapa facilita encontrar o cookie pelo nome sem depender da ordem recebida.
  const cookies = Object.fromEntries(
    (cabecalho || '').split(';').map(parte => {
      // Localiza o primeiro sinal de igual sem truncar valores que o contenham.
      // Índice que separa o nome do valor de cada cookie.
      const separador = parte.indexOf('=');
      return separador < 0
        ? ['', '']
        : [parte.slice(0, separador).trim(), parte.slice(separador + 1).trim()];
    }).filter(([nome]) => nome)
  );
  return cookies[nomeCookie] || '';
}

// Confere assinatura, e-mail autorizado e validade temporal da sessão.
function emailDaSessao(request) {
  // Separa o token recebido em conteúdo e assinatura.
  // Token encontrado no cabeçalho Cookie da requisição.
  const token = lerCookie(request.headers.cookie);
  // Posição do ponto que separa carga e assinatura no token.
  const separador = token.lastIndexOf('.');
  if (separador < 1) return null;

  // Recalcula a assinatura esperada e compara em tempo constante.
  // Dados que foram assinados e assinatura apresentada pelo navegador.
  const carga = token.slice(0, separador);
  const assinaturaRecebida = Buffer.from(token.slice(separador + 1));
  // Assinatura calculada com o segredo atual do servidor.
  const assinaturaEsperada = Buffer.from(assinatura(carga));
  if (assinaturaRecebida.length !== assinaturaEsperada.length
      || !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada)) return null;

  // Só aceita sessões válidas que pertençam ao administrador configurado.
  try {
    // Dados da sessão decodificados da carga previamente assinada.
    const sessao = JSON.parse(Buffer.from(carga, 'base64url').toString('utf8'));
    // E-mail autorizado atual, usado para invalidar sessões de outra conta.
    const emailAutorizado = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (sessao.email !== emailAutorizado || sessao.expira <= Math.floor(Date.now() / 1000)) return null;
    return sessao.email;
  } catch (erro) {
    if (erro instanceof SyntaxError) return null;
    throw erro;
  }
}

// Escreve uma resposta JSON e seus cabeçalhos na resposta da função Vercel.
function responder(response, status, dados, cabecalhos = {}) {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  if (status !== 204) response.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(cabecalhos).forEach(([nome, valor]) => response.setHeader(nome, valor));
  response.end(status === 204 ? '' : JSON.stringify(dados));
}

// Exporta os utilitários consumidos pelos handlers de login, sessão e logout.
module.exports = { criarCookie, emailDaSessao, nomeCookie, responder };
