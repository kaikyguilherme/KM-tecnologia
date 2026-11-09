function desenharCarrinho() {
  const itens = window.KmTecnologia.carrinho();
  const area = document.querySelector('#itens-carrinho');
  area.innerHTML = itens.length ? itens.map(item => `
    <article class="item-lista linha">
      <div><strong>${item.nome}</strong>${item.opcao ? `<span class="etiqueta">${item.opcao}</span>` : ''}<p>${item.tipo === 'servico' ? 'Serviço' : 'Produto'} · Quantidade: ${item.quantidade}</p></div>
      <button class="botao botao-perigo botao-pequeno" type="button" data-remover="${item.id}">Remover</button>
    </article>`).join('') : '<div class="vazio">Seu carrinho está vazio. Explore o catálogo ou escolha um serviço.</div>';
  document.querySelector('#finalizar-carrinho').disabled = !itens.length;
}
document.addEventListener('DOMContentLoaded', () => {
  desenharCarrinho();
  document.querySelector('#itens-carrinho').addEventListener('click', evento => {
    const botao = evento.target.closest('[data-remover]');
    if (!botao) return;
    window.KmTecnologia.guardarCarrinho(window.KmTecnologia.carrinho().filter(item => item.id !== botao.dataset.remover));
    window.KmTecnologia.atualizarContador();
    desenharCarrinho();
  });
  document.querySelector('#finalizar-carrinho').addEventListener('click', window.KmTecnologia.finalizarPedido);
});
