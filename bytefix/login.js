// Chave local usada para guardar as contas criadas neste navegador.
const chaveContas = 'km_tecnologia_contas';

// Recupera as contas locais através do helper comum do site.
function contasSalvas() {
  return window.KmTecnologia.ler(chaveContas, []);
}
// Redireciona após login para o retorno permitido ou para o perfil padrão.
function redirecionarAposLogin() {
  // Destino opcional recebido na query string antes de enviar o usuário ao login.
  const destino = new URLSearchParams(location.search).get('retorno');
  // Lista de páginas internas que podem ser usadas como retorno.
  const paginasPermitidas = ['index.html', 'catalogo.html', 'servicos.html', 'carrinho.html', 'usuario.html'];
  location.href = paginasPermitidas.includes(destino) ? destino : 'usuario.html';
}
// Mostra uma mensagem no formulário e alterna o estilo de erro.
function mostrarMensagem(texto, erro = false) {
  // Área de status visível para a pessoa que usa o formulário.
  const mensagem = document.querySelector('#mensagem-login');
  mensagem.textContent = texto;
  mensagem.classList.toggle('erro', erro);
}
// Configura alternância entre formulários e os fluxos de login e cadastro.
document.addEventListener('DOMContentLoaded', () => {
  // Referências aos dois formulários controlados por esta página.
  const formularios = {
    entrar: document.querySelector('#form-entrar'),
    criar: document.querySelector('#form-criar')
  };
  // Alterna a aba ativa e mostra o formulário correspondente.
  document.querySelectorAll('[data-formulario]').forEach(botao => {
    botao.addEventListener('click', () => {
      // Abas disponíveis na tela, cuja seleção controla qual formulário aparece.
      document.querySelectorAll('[data-formulario]').forEach(aba => aba.classList.toggle('ativa', aba === botao));
      // Atualiza a visibilidade dos formulários conforme a aba selecionada.
      Object.entries(formularios).forEach(([nome, formulario]) => formulario.classList.toggle('oculto', nome !== botao.dataset.formulario));
      mostrarMensagem('');
    });
  });
  // Valida localmente a conta e registra o usuário atualmente conectado.
  formularios.entrar.addEventListener('submit', evento => {
    evento.preventDefault();
    // Lê os campos preenchidos no formulário de login.
    const dados = new FormData(formularios.entrar);
    // Procura uma conta cujo e-mail e senha correspondam aos dados digitados.
    const conta = contasSalvas().find(item => item.email === String(dados.get('email')).trim().toLowerCase() && item.senha === dados.get('senha'));
    if (!conta) {
      mostrarMensagem('E-mail ou senha incorretos.', true);
      return;
    }
    if (!window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, { nome: conta.nome, email: conta.email, foto: conta.foto || '' })) return;
    redirecionarAposLogin();
  });
  // Cria uma conta local depois de verificar se o e-mail ainda não está cadastrado.
  formularios.criar.addEventListener('submit', evento => {
    evento.preventDefault();
    // Normaliza e coleta os campos enviados no formulário de cadastro.
    const dados = new FormData(formularios.criar);
    // Informações básicas da nova conta local.
    const nome = String(dados.get('nome')).trim();
    const email = String(dados.get('email')).trim().toLowerCase();
    const senha = String(dados.get('senha'));
    // Lista atualizada das contas armazenadas no navegador.
    const contas = contasSalvas();
    if (contas.some(conta => conta.email === email)) {
      mostrarMensagem('Já existe uma conta com este e-mail. Entre na sua conta.', true);
      return;
    }
    contas.push({ nome, email, senha, foto: '' });
    if (!window.KmTecnologia.gravar(chaveContas, contas)) return;
    window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, { nome, email, foto: '' });
    redirecionarAposLogin();
  });
});
