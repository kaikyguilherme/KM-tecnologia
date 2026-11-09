function textoSeguro(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
}
function contarItensServico(pedido) {
  return pedido.itens.filter(item => item.tipo === 'servico').reduce((total, item) => total + item.quantidade, 0);
}
function renderizarPainel() {
  const pedidos = window.KmTecnologia.pedidos().filter(pedido => pedido.itens.some(item => item.tipo === 'servico')).sort((a, b) => new Date(b.data) - new Date(a.data));
  const totalServicos = pedidos.reduce((total, pedido) => total + contarItensServico(pedido), 0);
  const concluidos = pedidos.filter(pedido => pedido.status === 'Concluído').length;
  document.querySelector('#resumo-painel').innerHTML = `
    <div class="resumo-caixa"><strong>${pedidos.length}</strong>pedido(s) de serviço</div>
    <div class="resumo-caixa"><strong>${totalServicos}</strong>serviço(s) solicitados</div>
    <div class="resumo-caixa"><strong>${concluidos}</strong>pedido(s) concluído(s)</div>`;
  const area = document.querySelector('#pedidos-painel');
  area.innerHTML = pedidos.length ? pedidos.map(pedido => `
    <article class="item-lista pedido-admin">
      <div>
        <div class="linha"><strong>${textoSeguro(pedido.id)} · ${textoSeguro(pedido.usuarioNome)}</strong><span class="etiqueta">${textoSeguro(pedido.status)}</span></div>
        <p>${textoSeguro(pedido.usuarioEmail)} · ${new Date(pedido.data).toLocaleString('pt-BR')}</p>
        <p>${pedido.itens.map(item => `${textoSeguro(item.nome)}${item.opcao ? ` (${textoSeguro(item.opcao)})` : ''} × ${item.quantidade}`).join(' · ')}</p>
      </div>
      ${pedido.status !== 'Concluído' ? `<button class="botao botao-pequeno" type="button" data-concluir="${textoSeguro(pedido.id)}">Marcar como concluído</button>` : '<span class="etiqueta">Feedback liberado</span>'}
    </article>`).join('') : '<div class="vazio">Ainda não há solicitações de serviços neste navegador.</div>';
}
document.addEventListener('DOMContentLoaded', () => {
  const estado = document.querySelector('#estado-painel');
  const conteudo = document.querySelector('#conteudo-painel');
  fetch('/api/auth/session', { credentials: 'same-origin' }).then(async resposta => {
    if (resposta.status === 401) {
      location.replace('admin-login.html');
      return;
    }
    if (!resposta.ok) throw new Error('O servidor não conseguiu validar o acesso administrativo.');
    const sessao = await resposta.json();
    document.querySelector('#email-painel').textContent = `Sessão ativa: ${sessao.email}`;
    estado.textContent = '';
    conteudo.classList.remove('oculto');
    renderizarPainel();
  }).catch(erro => {
    estado.textContent = `${erro.message} Abra o painel pelo site publicado no Vercel.`;
    estado.classList.add('erro');
  });
  document.querySelector('#sair-painel').addEventListener('click', async () => {
    try {
      const resposta = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!resposta.ok) throw new Error('Não foi possível encerrar a sessão.');
      location.replace('admin-login.html');
    } catch (erro) {
      estado.textContent = erro.message;
      estado.classList.add('erro');
    }
  });
  document.querySelector('#pedidos-painel').addEventListener('click', evento => {
    const botao = evento.target.closest('[data-concluir]');
    if (!botao) return;
    const pedidos = window.KmTecnologia.pedidos();
    const pedido = pedidos.find(item => item.id === botao.dataset.concluir);
    if (!pedido || !pedido.itens.some(item => item.tipo === 'servico')) return;
    pedido.status = 'Concluído';
    pedido.concluidoEm = new Date().toISOString();
    if (window.KmTecnologia.gravar(window.KmTecnologia.chavePedidos, pedidos)) renderizarPainel();
  });
});
