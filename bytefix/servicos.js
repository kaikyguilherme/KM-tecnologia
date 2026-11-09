const servicos = [
  { id: 'pasta-termica', nome: 'Troca da pasta térmica', icone: '◉', descricao: 'Substituição da pasta térmica para ajudar na dissipação de calor e no funcionamento estável do equipamento.' },
  { id: 'windows', nome: 'Instalação do Windows', icone: '▦', descricao: 'Instalação e configuração do sistema operacional. A disponibilidade e a licença são confirmadas no orçamento.', opcoes: ['Windows 10', 'Windows 11', 'Windows 10 com pacote Office', 'Windows 11 com pacote Office'] },
  { id: 'bateria-notebook', nome: 'Troca de bateria de notebook', icone: '▰', descricao: 'Avaliação e substituição da bateria do notebook por uma peça compatível com o modelo.' },
  { id: 'upgrade-downgrade', nome: 'Upgrade ou downgrade de peças', icone: '↗', descricao: 'Avaliação e substituição de componentes para ajustar desempenho ou configuração do computador.' },
  { id: 'montagem-desktop', nome: 'Montagem de desktop', icone: '▣', descricao: 'Montagem cuidadosa dos componentes e verificação básica do funcionamento do computador.' },
  { id: 'tela-notebook', nome: 'Troca de tela de notebook', icone: '▱', descricao: 'Diagnóstico e substituição da tela conforme o modelo e as especificações do notebook.' },
  { id: 'dobradicas', nome: 'Reparo de dobradiças', icone: '⌁', descricao: 'Inspeção e reparo das dobradiças e da estrutura da tampa do notebook.' }
];

function desenharServicos() {
  const lista = document.querySelector('#lista-servicos');
  if (!lista) return;
  lista.innerHTML = servicos.map(servico => `
    <article class="cartao cartao-servico">
      <span class="icone-servico" aria-hidden="true">${servico.icone}</span>
      <h3>${servico.nome}</h3>
      <p>${servico.descricao}</p>
      ${servico.opcoes ? `<div class="campo"><label for="opcao-${servico.id}">Selecione uma opção</label><select id="opcao-${servico.id}">${servico.opcoes.map(opcao => `<option>${opcao}</option>`).join('')}</select></div>` : ''}
      <button class="botao botao-secundario" type="button" data-servico="${servico.id}">Adicionar à solicitação</button>
    </article>`).join('');
}
document.addEventListener('DOMContentLoaded', () => {
  desenharServicos();
  document.querySelector('#lista-servicos').addEventListener('click', evento => {
    const botao = evento.target.closest('[data-servico]');
    if (!botao) return;
    if (!window.KmTecnologia.usuarioEntrou()) {
      alert('Entre ou crie sua conta para solicitar um serviço.');
      location.href = 'login.html?retorno=servicos.html';
      return;
    }
    const servico = servicos.find(item => item.id === botao.dataset.servico);
    if (!servico) return;
    const opcao = servico.opcoes ? document.querySelector(`#opcao-${servico.id}`).value : '';
    window.KmTecnologia.adicionarAoCarrinho({
      id: `${servico.id}${opcao ? `-${opcao.replace(/\s/g, '').toLowerCase()}` : ''}`,
      nome: servico.nome,
      opcao,
      tipo: 'servico'
    });
  });
});
