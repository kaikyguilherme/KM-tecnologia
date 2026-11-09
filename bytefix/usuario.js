// Codifica caracteres especiais antes de inserir texto do usuário em HTML.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
}
// Soma as quantidades de serviços presentes nos pedidos recebidos.
function contarServicos(pedidos) {
  return pedidos.reduce((total, pedido) => total + pedido.itens.filter(item => item.tipo === 'servico').reduce((soma, item) => soma + item.quantidade, 0), 0);
}
// Monta o perfil e o histórico de solicitações da conta conectada.
document.addEventListener('DOMContentLoaded', () => {
  // Área principal que receberá o conteúdo do perfil.
  const area = document.querySelector('#conteudo-perfil');
  // Dados da conta atualmente conectada neste navegador.
  const usuario = window.KmTecnologia.usuarioAtual();
  if (!usuario) {
    area.innerHTML = '<div class="vazio">Entre na sua conta para consultar seus dados e solicitações.<p><a class="botao" href="login.html">Entrar ou criar conta</a></p></div>';
    return;
  }
  // Lista e ordena os pedidos pertencentes à conta conectada.
  const pedidos = window.KmTecnologia.pedidos().filter(pedido => pedido.usuarioEmail === usuario.email).sort((a, b) => new Date(b.data) - new Date(a.data));
  // Quantidade total de serviços contida no histórico da conta.
  const quantidadeServicos = contarServicos(pedidos);
  // HTML dos cartões de pedido ou aviso quando ainda não há solicitações.
  const pedidosHtml = pedidos.length ? pedidos.map(pedido => `
    <article class="item-lista">
      <div class="linha"><strong>${escapar(pedido.id)} · ${escapar(pedido.tipo)}</strong><span class="etiqueta">${escapar(pedido.status)}</span></div>
      <p>${pedido.itens.map(item => `${escapar(item.nome)}${item.opcao ? ` (${escapar(item.opcao)})` : ''} × ${item.quantidade}`).join(' · ')}</p>
      <small>${new Date(pedido.data).toLocaleString('pt-BR')}</small>
    </article>`).join('') : '<div class="vazio">Você ainda não fez solicitações.</div>';
  area.innerHTML = `
    <section class="cartao perfil-cabecalho">
      <div class="foto-perfil">${usuario.foto ? `<img src="${usuario.foto}" alt="Foto de perfil de ${escapar(usuario.nome)}">` : '<span aria-hidden="true">KM</span>'}</div>
      <div><h2>${escapar(usuario.nome)}</h2><p>${escapar(usuario.email)}</p>
        <div class="campo"><label for="foto-perfil-arquivo">Alterar foto de perfil</label><input id="foto-perfil-arquivo" type="file" accept="image/png,image/jpeg,image/webp"></div>
        <div class="perfil-acoes"><button class="botao botao-perigo botao-pequeno" id="sair-conta" type="button">Sair da conta</button></div>
      </div>
    </section>
    <section class="perfil-resumo" aria-label="Resumo da conta">
      <div class="resumo-caixa"><strong>${quantidadeServicos}</strong>serviço(s) solicitado(s)</div>
      <div class="resumo-caixa"><strong>${pedidos.length}</strong>pedido(s) registrado(s)</div>
    </section>
    <section class="secao-menor"><h2>Histórico de solicitações</h2><div class="lista">${pedidosHtml}</div></section>
    <div class="aviso">Este histórico é armazenado apenas neste navegador. Para acessar de outros aparelhos, será necessário conectar o site a um servidor e banco de dados.</div>`;
  // Remove o usuário atual do navegador e retorna à página inicial.
  document.querySelector('#sair-conta').addEventListener('click', () => {
    localStorage.removeItem(window.KmTecnologia.chaveUsuario);
    location.href = 'index.html';
  });
  // Lê e valida uma nova imagem de perfil selecionada pelo usuário.
  document.querySelector('#foto-perfil-arquivo').addEventListener('change', evento => {
    // Arquivo de imagem escolhido no controle de upload.
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem.');
      evento.target.value = '';
      return;
    }
    if (arquivo.size > 1024 * 1024) {
      alert('A imagem deve ter no máximo 1 MB.');
      evento.target.value = '';
      return;
    }
    // FileReader converte a imagem local para armazená-la junto à conta.
    const leitor = new FileReader();
    leitor.addEventListener('load', () => {
      // Atualiza a conta e a sessão local com a imagem convertida.
      const contas = window.KmTecnologia.ler('km_tecnologia_contas', []);
      // Conta cujo e-mail corresponde ao perfil atualmente autenticado.
      const conta = contas.find(item => item.email === usuario.email);
      if (!conta) {
        alert('Não foi possível encontrar a conta local.');
        return;
      }
      conta.foto = leitor.result;
      if (!window.KmTecnologia.gravar('km_tecnologia_contas', contas)) return;
      if (window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, { ...usuario, foto: leitor.result })) location.reload();
    });
    leitor.addEventListener('error', () => alert('Não foi possível carregar a imagem selecionada.'));
    leitor.readAsDataURL(arquivo);
  });
});
