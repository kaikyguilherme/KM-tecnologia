const chaveContas = 'km_tecnologia_contas';

function contasSalvas() {
  return window.KmTecnologia.ler(chaveContas, []);
}
function redirecionarAposLogin() {
  const destino = new URLSearchParams(location.search).get('retorno');
  const paginasPermitidas = ['index.html', 'catalogo.html', 'servicos.html', 'carrinho.html', 'usuario.html'];
  location.href = paginasPermitidas.includes(destino) ? destino : 'usuario.html';
}
function mostrarMensagem(texto, erro = false) {
  const mensagem = document.querySelector('#mensagem-login');
  mensagem.textContent = texto;
  mensagem.classList.toggle('erro', erro);
}
document.addEventListener('DOMContentLoaded', () => {
  const formularios = {
    entrar: document.querySelector('#form-entrar'),
    criar: document.querySelector('#form-criar')
  };
  document.querySelectorAll('[data-formulario]').forEach(botao => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('[data-formulario]').forEach(aba => aba.classList.toggle('ativa', aba === botao));
      Object.entries(formularios).forEach(([nome, formulario]) => formulario.classList.toggle('oculto', nome !== botao.dataset.formulario));
      mostrarMensagem('');
    });
  });
  formularios.entrar.addEventListener('submit', evento => {
    evento.preventDefault();
    const dados = new FormData(formularios.entrar);
    const conta = contasSalvas().find(item => item.email === String(dados.get('email')).trim().toLowerCase() && item.senha === dados.get('senha'));
    if (!conta) {
      mostrarMensagem('E-mail ou senha incorretos.', true);
      return;
    }
    if (!window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, { nome: conta.nome, email: conta.email, foto: conta.foto || '' })) return;
    redirecionarAposLogin();
  });
  formularios.criar.addEventListener('submit', evento => {
    evento.preventDefault();
    const dados = new FormData(formularios.criar);
    const nome = String(dados.get('nome')).trim();
    const email = String(dados.get('email')).trim().toLowerCase();
    const senha = String(dados.get('senha'));
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
