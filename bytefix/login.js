// Redireciona após autenticação para o destino permitido ou para o perfil padrão.
function redirecionarAposLogin() {
  const destino = new URLSearchParams(location.search).get('retorno');
  const paginasPermitidas = ['index.html', 'catalogo.html', 'servicos.html', 'carrinho.html', 'usuario.html'];
  location.href = paginasPermitidas.includes(destino) ? destino : 'usuario.html';
}

// Exibe o estado atual do formulário de acesso do cliente.
function mostrarMensagem(texto, erro = false) {
  const mensagem = document.querySelector('#mensagem-login');
  mensagem.textContent = texto;
  mensagem.classList.toggle('erro', erro);
}

// Envia os dados do formulário para a API e guarda apenas o perfil público em cache.
async function enviarFormulario(formulario, caminho, dados) {
  const botao = formulario.querySelector('button[type="submit"]');
  botao.disabled = true;
  mostrarMensagem('Aguarde, verificando seus dados…');
  try {
    const resultado = await window.KmTecnologia.requisicaoApi(caminho, {
      method: 'POST',
      body: JSON.stringify(dados)
    });
    if (resultado.confirmacaoNecessaria) {
      mostrarMensagem('Conta criada. Confirme o e-mail enviado antes de entrar.');
      return false;
    }
    window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, resultado.usuario);
    return true;
  } catch (erro) {
    mostrarMensagem(erro.message, true);
    return false;
  } finally {
    botao.disabled = false;
  }
}

// Alterna os formulários e conecta login e cadastro ao Supabase Auth pelo servidor.
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

  formularios.entrar.addEventListener('submit', async evento => {
    evento.preventDefault();
    const dados = new FormData(formularios.entrar);
    const entrou = await enviarFormulario(formularios.entrar, '/api/customer/login', {
      email: String(dados.get('email')).trim().toLowerCase(),
      senha: String(dados.get('senha'))
    });
    if (entrou) redirecionarAposLogin();
  });

  formularios.criar.addEventListener('submit', async evento => {
    evento.preventDefault();
    const dados = new FormData(formularios.criar);
    const entrou = await enviarFormulario(formularios.criar, '/api/customer/signup', {
      nome: String(dados.get('nome')).trim(),
      email: String(dados.get('email')).trim().toLowerCase(),
      senha: String(dados.get('senha'))
    });
    if (entrou) redirecionarAposLogin();
  });
});
