document.addEventListener('DOMContentLoaded', async () => {
  const mensagem = document.querySelector('#mensagem-admin');
  try {
    const sessao = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (sessao.ok) {
      location.replace('painel.html');
      return;
    }
    if (sessao.status !== 401) throw new Error('O servidor não está configurado para autenticação.');
  } catch (erro) {
    mensagem.textContent = 'Não foi possível acessar o servidor. Abra o site publicado no Vercel e confira a configuração.';
    mensagem.classList.add('erro');
    return;
  }

  document.querySelector('#form-admin').addEventListener('submit', async evento => {
    evento.preventDefault();
    const botao = evento.currentTarget.querySelector('button[type="submit"]');
    botao.disabled = true;
    mensagem.textContent = 'Verificando acesso…';
    mensagem.classList.remove('erro');
    const dados = new FormData(evento.currentTarget);
    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: dados.get('email'), senha: dados.get('senha') })
      });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível entrar.');
      location.replace('painel.html');
    } catch (erro) {
      mensagem.textContent = erro.message === 'Failed to fetch'
        ? 'Não foi possível falar com o servidor. Confira a implantação e tente novamente.'
        : erro.message;
      mensagem.classList.add('erro');
      botao.disabled = false;
    }
  });
});
