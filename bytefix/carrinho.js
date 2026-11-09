// Monta novamente a lista visual de itens e atualiza o botão de finalização.
function desenharCarrinho() {
  // Itens atualmente salvos no carrinho do navegador.
  const itens = window.KmTecnologia.carrinho();
  // Elemento da página que recebe os itens ou o aviso de carrinho vazio.
  const area = document.querySelector('#itens-carrinho');
  area.innerHTML = itens.length ? itens.map(item => `
    <article class="item-lista linha">
      <div><strong>${item.nome}</strong>${item.opcao ? `<span class="etiqueta">${item.opcao}</span>` : ''}<p>${item.tipo === 'servico' ? 'Serviço' : 'Produto'} · Quantidade: ${item.quantidade}</p></div>
      <button class="botao botao-perigo botao-pequeno" type="button" data-remover="${item.id}">Remover</button>
    </article>`).join('') : '<div class="vazio">Seu carrinho está vazio. Explore o catálogo ou escolha um serviço.</div>';
  document.querySelector('#finalizar-carrinho').disabled = !itens.length;
}
// Liga os controles do carrinho depois que o HTML estiver disponível.
document.addEventListener('DOMContentLoaded', () => {
  desenharCarrinho();
  // Trata cliques na lista por delegação, incluindo botões criados dinamicamente.
  document.querySelector('#itens-carrinho').addEventListener('click', evento => {
    // Identifica o botão de remoção mais próximo do ponto clicado.
    const botao = evento.target.closest('[data-remover]');
    if (!botao) return;
    // Persiste o carrinho sem o item selecionado e atualiza a interface.
    window.KmTecnologia.guardarCarrinho(window.KmTecnologia.carrinho().filter(item => item.id !== botao.dataset.remover));
    window.KmTecnologia.atualizarContador();
    desenharCarrinho();
  });
  document.querySelector('#finalizar-carrinho').addEventListener('click', window.KmTecnologia.finalizarPedido);
});
