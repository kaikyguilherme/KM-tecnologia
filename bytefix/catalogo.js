// Dados que definem os produtos exibidos e suas opções, quando aplicável.
const produtos = [
  { id: 'powerbank', nome: 'Bateria portátil (Powerbank)', icone: '◉', descricao: 'Energia extra para carregar seu celular onde estiver.', opcoes: ['5000 mAh', '10000 mAh', '20000 mAh'] },
  { id: 'fone-bluetooth', nome: 'Fone Bluetooth', icone: '♫', descricao: 'Liberdade sem fio para música e chamadas.' },
  { id: 'fone-com-fio', nome: 'Fone com fio', icone: '♬', descricao: 'Praticidade e áudio para o seu dia a dia.' },
  { id: 'carregador', nome: 'Carregador', icone: 'ϟ', descricao: 'Carregadores para manter seus dispositivos prontos.' },
  { id: 'cabo-carregador', nome: 'Cabo de carregador', icone: '⌁', descricao: 'Cabos para carregar e conectar seus equipamentos.' },
  { id: 'fonte-carregador', nome: 'Fonte de carregador', icone: '▰', descricao: 'Fontes compatíveis com diferentes dispositivos.' },
  { id: 'mouse', nome: 'Mouse', icone: '⌖', descricao: 'Acessório para trabalhar, estudar ou jogar.' },
  { id: 'teclado', nome: 'Teclado', icone: '⌨', descricao: 'Teclados para completar seu espaço de trabalho.' }
];

// Constrói os cartões de produto e seus controles de seleção e inclusão.
function desenharProdutos() {
  // Contêiner no qual os cartões do catálogo serão inseridos.
  const lista = document.querySelector('#lista-produtos');
  if (!lista) return;
  lista.innerHTML = produtos.map(produto => `
    <article class="cartao cartao-produto">
      <div class="cartao-imagem" aria-label="Espaço para foto de ${produto.nome}">
        ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}">` : `<span aria-hidden="true">${produto.icone}</span>`}
      </div>
      <div class="cartao-conteudo">
        <h3>${produto.nome}</h3>
        <p>${produto.descricao}</p>
        ${produto.opcoes ? `<div class="produto-opcao campo"><label for="opcao-${produto.id}">Capacidade</label><select id="opcao-${produto.id}">${produto.opcoes.map(opcao => `<option>${opcao}</option>`).join('')}</select></div>` : ''}
        <span class="preco">Consulte disponibilidade e valor</span>
        <button class="botao botao-secundario" type="button" data-produto="${produto.id}">Adicionar ao carrinho</button>
      </div>
    </article>`).join('');
}
// Inicializa a listagem e o tratamento de inclusão no carrinho.
document.addEventListener('DOMContentLoaded', () => {
  desenharProdutos();
  // Um único listener atende aos botões de produto criados dinamicamente.
  document.querySelector('#lista-produtos').addEventListener('click', evento => {
    // Localiza o botão associado ao cartão clicado.
    const botao = evento.target.closest('[data-produto]');
    if (!botao) return;
    // Recupera os dados do produto selecionado e sua opção.
    const produto = produtos.find(item => item.id === botao.dataset.produto);
    if (!produto) return;
    // Obtém a opção escolhida, se este produto oferecer opções.
    const opcao = produto.opcoes ? document.querySelector(`#opcao-${produto.id}`).value : '';
    window.KmTecnologia.adicionarAoCarrinho({
      id: `${produto.id}${opcao ? `-${opcao.replace(/\s/g, '').toLowerCase()}` : ''}`,
      nome: produto.nome,
      opcao,
      tipo: 'produto'
    });
  });
});
