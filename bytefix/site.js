(() => {
  const chavesAntigas = ['bytefix_carrinho', 'bytefix_pedidos', 'bytefix_usuario_atual', 'bytefix_contas', 'bytefix_feedbacks'];
  const chavesNovas = ['km_tecnologia_carrinho', 'km_tecnologia_pedidos', 'km_tecnologia_usuario_atual', 'km_tecnologia_contas', 'km_tecnologia_feedbacks'];
  chavesAntigas.forEach((chaveAntiga, indice) => {
    const chaveNova = chavesNovas[indice];
    if (localStorage.getItem(chaveNova) === null && localStorage.getItem(chaveAntiga) !== null) {
      localStorage.setItem(chaveNova, localStorage.getItem(chaveAntiga));
    }
  });
  const chaveCarrinho = 'km_tecnologia_carrinho';
  const chavePedidos = 'km_tecnologia_pedidos';
  const chaveUsuario = 'km_tecnologia_usuario_atual';
  const numeroWhatsApp = '5571988015807'; // Troque pelo número da loja com DDI e DDD.
  const links = [
    ['Início', 'index.html', 'inicio'],
    ['Catálogo', 'catalogo.html', 'catalogo'],
    ['Serviços', 'servicos.html', 'servicos'],
    ['Feedbacks', 'feedback.html', 'feedback'],
    ['Suporte', 'suporte.html', 'suporte'],
    ['Técnico', 'tecnico.html', 'tecnico'],
    ['Minha conta', 'usuario.html', 'usuario']
  ];

  function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; }
    catch (erro) {
      console.error(`Não foi possível ler os dados locais (${chave}).`, erro);
      return padrao;
    }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (erro) {
      console.error(`Não foi possível salvar os dados locais (${chave}).`, erro);
      alert('Não foi possível salvar. Verifique o espaço disponível no navegador.');
      return false;
    }
  }
  function usuarioAtual() { return ler(chaveUsuario, null); }
  function carrinho() { return ler(chaveCarrinho, []); }
  function guardarCarrinho(itens) { return gravar(chaveCarrinho, itens); }
  function pedidos() { return ler(chavePedidos, []); }
  function usuarioEntrou() { return Boolean(usuarioAtual()); }

  function atualizarContador() {
    const contador = document.querySelector('[data-contador-carrinho]');
    if (contador) contador.textContent = carrinho().reduce((soma, item) => soma + item.quantidade, 0);
  }
  function montarCabecalho() {
    const cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;
    const pagina = document.body.dataset.pagina;
    cabecalho.className = 'cabecalho';
    cabecalho.innerHTML = `
      <div class="cabecalho-conteudo">
        <a class="marca" href="index.html" aria-label="KM Tecnologia, início">KM <span>TECNOLOGIA</span></a>
        <button class="botao botao-secundario botao-pequeno menu-alternar" type="button" aria-expanded="false" aria-label="Abrir menu">☰</button>
        <nav class="navegacao" aria-label="Navegação principal">
          ${links.map(([nome, href, id]) => `<a href="${href}" class="${pagina === id ? 'ativa' : ''}">${nome}</a>`).join('')}
        </nav>
        <div class="acoes-cabecalho">
          <a class="botao botao-secundario botao-pequeno" href="carrinho.html">Carrinho <span class="contador-carrinho" data-contador-carrinho>0</span></a>
          <a class="botao botao-pequeno" href="${usuarioEntrou() ? 'usuario.html' : 'login.html'}">${usuarioEntrou() ? 'Perfil' : 'Entrar'}</a>
        </div>
      </div>`;
    const alternar = cabecalho.querySelector('.menu-alternar');
    alternar.addEventListener('click', () => {
      const menu = cabecalho.querySelector('.navegacao');
      const aberto = menu.classList.toggle('aberta');
      alternar.setAttribute('aria-expanded', String(aberto));
    });
  }
  function montarRodape() {
    const rodape = document.querySelector('[data-rodape]');
    if (rodape) rodape.innerHTML = `<div class="rodape-conteudo"><span>© ${new Date().getFullYear()} KM Tecnologia · Tecnologia com cuidado.</span><a href="admin-login.html">Área administrativa</a></div>`;
  }
  function adicionarAoCarrinho(item) {
    const itens = carrinho();
    const existente = itens.find(atual => atual.id === item.id);
    if (existente) existente.quantidade += 1;
    else itens.push({ ...item, quantidade: 1 });
    if (guardarCarrinho(itens)) {
      atualizarContador();
      alert(`${item.nome} foi adicionado ao carrinho.`);
    }
  }
  function telefoneConfigurado() {
    return /^\d{12,13}$/.test(numeroWhatsApp) && !numeroWhatsApp.includes('000000');
  }
  function finalizarPedido() {
    const usuario = usuarioAtual();
    if (!usuario) {
      alert('Entre ou crie sua conta antes de finalizar o pedido.');
      location.href = 'login.html?retorno=carrinho.html';
      return;
    }
    const itens = carrinho();
    if (!itens.length) {
      alert('Seu carrinho está vazio.');
      return;
    }
    const pedido = {
      id: `KM-${Date.now().toString().slice(-8)}`,
      usuarioEmail: usuario.email,
      usuarioNome: usuario.nome,
      data: new Date().toISOString(),
      tipo: itens.some(item => item.tipo === 'servico') ? 'Serviço' : 'Produto',
      status: 'Aguardando contato',
      itens
    };
    const historico = pedidos();
    historico.push(pedido);
    if (!gravar(chavePedidos, historico)) return;
    gravar(chaveCarrinho, []);
    atualizarContador();
    const linhas = itens.map(item => `• ${item.nome}${item.opcao ? ` (${item.opcao})` : ''} — qtd. ${item.quantidade}`).join('\n');
    const mensagem = `Olá! Quero solicitar este pedido na KM Tecnologia:\n${linhas}\n\nPedido ${pedido.id}\nCliente: ${usuario.nome}`;
    if (!telefoneConfigurado()) {
      alert(`Pedido ${pedido.id} salvo neste navegador, mas o WhatsApp da loja ainda não foi configurado. Atualize o número em site.js para receber a solicitação.`);
      location.href = 'usuario.html';
      return;
    }
    window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
    alert(`Pedido ${pedido.id} registrado. Envie a mensagem que foi aberta no WhatsApp para concluir a solicitação.`);
    location.href = 'usuario.html';
  }

  window.KmTecnologia = { ler, gravar, usuarioAtual, usuarioEntrou, carrinho, guardarCarrinho, pedidos, adicionarAoCarrinho, finalizarPedido, atualizarContador, chaveUsuario, chavePedidos, chaveCarrinho };
  document.addEventListener('DOMContentLoaded', () => {
    montarCabecalho();
    montarRodape();
    atualizarContador();
  });
})();
