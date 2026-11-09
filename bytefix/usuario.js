// Codifica texto do usuário antes de inseri-lo no HTML do perfil.
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
}

// Soma as quantidades de serviços presentes nos pedidos recebidos.
function contarServicos(pedidos) {
  return pedidos.reduce((total, pedido) => total + pedido.items.filter(item => item.tipo === 'servico').reduce((soma, item) => soma + item.quantidade, 0), 0);
}

// Carrega do servidor a sessão e o histórico de pedidos do cliente.
document.addEventListener('DOMContentLoaded', async () => {
  const area = document.querySelector('#conteudo-perfil');
  try {
    const usuario = await window.KmTecnologia.sincronizarUsuario();
    if (!usuario) {
      area.innerHTML = '<div class="vazio">Entre na sua conta para consultar seus dados e solicitações.<p><a class="botao" href="login.html">Entrar ou criar conta</a></p></div>';
      return;
    }

    const resultado = await window.KmTecnologia.requisicaoApi('/api/orders');
    const pedidos = resultado.pedidos;
    const quantidadeServicos = contarServicos(pedidos);
    const pedidosHtml = pedidos.length ? pedidos.map(pedido => `
      <article class="item-lista">
        <div class="linha"><strong>${escapar(pedido.id)} · ${escapar(pedido.order_type)}</strong><span class="etiqueta">${escapar(pedido.status)}</span></div>
        <p>${pedido.items.map(item => `${escapar(item.nome)}${item.opcao ? ` (${escapar(item.opcao)})` : ''} × ${item.quantidade}`).join(' · ')}</p>
        <small>${new Date(pedido.created_at).toLocaleString('pt-BR')}</small>
      </article>`).join('') : '<div class="vazio">Você ainda não fez solicitações.</div>';

    area.innerHTML = `
      <section class="cartao perfil-cabecalho">
        <div class="foto-perfil">${usuario.foto ? `<img src="${escapar(usuario.foto)}" alt="Foto de perfil de ${escapar(usuario.nome)}">` : `<span aria-hidden="true">${escapar((usuario.nome || 'KM').slice(0, 2).toUpperCase())}</span>`}</div>
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
      <div class="aviso">Seus pedidos são salvos no banco de dados e ficam disponíveis ao entrar na sua conta em outro dispositivo.</div>`;

    document.querySelector('#sair-conta').addEventListener('click', async () => {
      try {
        await window.KmTecnologia.requisicaoApi('/api/customer/logout', { method: 'POST' });
        localStorage.removeItem(window.KmTecnologia.chaveUsuario);
        location.href = 'index.html';
      } catch (erro) {
        alert(erro.message);
      }
    });
    document.querySelector('#foto-perfil-arquivo').addEventListener('change', evento => {
      const arquivo = evento.target.files[0];
      if (!arquivo) return;
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type) || arquivo.size > 1024 * 1024) {
        alert('Selecione uma imagem PNG, JPEG ou WebP de até 1 MB.');
        evento.target.value = '';
        return;
      }

      const leitor = new FileReader();
      leitor.addEventListener('load', async () => {
        const campo = evento.target;
        campo.disabled = true;
        try {
          const resultado = await window.KmTecnologia.requisicaoApi('/api/customer/avatar', {
            method: 'PUT',
            body: JSON.stringify({ imagem: leitor.result })
          });
          window.KmTecnologia.gravar(window.KmTecnologia.chaveUsuario, resultado.usuario);
          location.reload();
        } catch (erro) {
          alert(erro.message);
          campo.disabled = false;
        }
      });
      leitor.addEventListener('error', () => alert('Não foi possível carregar a imagem selecionada.'));
      leitor.readAsDataURL(arquivo);
    });
  } catch (erro) {
    area.innerHTML = `<div class="vazio erro">${escapar(erro.message)}</div>`;
  }
});
