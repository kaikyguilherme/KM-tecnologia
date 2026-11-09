// Define os recursos comuns compartilhados por todas as páginas do site.
(() => {
  // Chaves usadas em versões anteriores para preservar dados já salvos no navegador.
  const chavesAntigas = ['bytefix_carrinho', 'bytefix_pedidos', 'bytefix_usuario_atual', 'bytefix_contas', 'bytefix_feedbacks'];
  // Nomes atuais das chaves de armazenamento local, alinhados por índice com as antigas.
  const chavesNovas = ['km_tecnologia_carrinho', 'km_tecnologia_pedidos', 'km_tecnologia_usuario_atual', 'km_tecnologia_contas', 'km_tecnologia_feedbacks'];
  // Migra dados antigos sem sobrescrever dados que já existam no formato atual.
  chavesAntigas.forEach((chaveAntiga, indice) => {
    // Chave de destino correspondente à chave antiga na mesma posição.
    const chaveNova = chavesNovas[indice];
    if (localStorage.getItem(chaveNova) === null && localStorage.getItem(chaveAntiga) !== null) {
      localStorage.setItem(chaveNova, localStorage.getItem(chaveAntiga));
    }
  });
  // Identificadores usados para guardar carrinho, pedidos e usuário atual.
  const chaveCarrinho = 'km_tecnologia_carrinho';
  const chavePedidos = 'km_tecnologia_pedidos';
  const chaveUsuario = 'km_tecnologia_usuario_atual';
  // Telefone da loja no formato internacional, usado na abertura do WhatsApp.
  const numeroWhatsApp = '5571988015807'; // Troque pelo número da loja com DDI e DDD.
  // Links da navegação e os identificadores usados para destacar a página ativa.
  const links = [
    ['Início', 'index.html', 'inicio'],
    ['Catálogo', 'catalogo.html', 'catalogo'],
    ['Serviços', 'servicos.html', 'servicos'],
    ['Feedbacks', 'feedback.html', 'feedback'],
    ['Suporte', 'suporte.html', 'suporte'],
    ['Técnico', 'tecnico.html', 'tecnico'],
    ['Minha conta', 'usuario.html', 'usuario']
  ];

  // Lê um valor JSON do armazenamento local ou retorna o padrão se estiver ausente/inválido.
  function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; }
    catch (erro) {
      console.error(`Não foi possível ler os dados locais (${chave}).`, erro);
      return padrao;
    }
  }
  // Serializa e salva um valor local; informa falhas ao console e à pessoa usuária.
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (erro) {
      console.error(`Não foi possível salvar os dados locais (${chave}).`, erro);
      alert('Não foi possível salvar. Verifique o espaço disponível no navegador.');
      return false;
    }
  }
  // Devolve os dados da conta conectada, se houver.
  function usuarioAtual() { return ler(chaveUsuario, null); }
  // Devolve os itens do carrinho, usando uma lista vazia como padrão.
  function carrinho() { return ler(chaveCarrinho, []); }
  // Salva a lista atualizada de itens do carrinho.
  function guardarCarrinho(itens) { return gravar(chaveCarrinho, itens); }
  // Devolve o histórico local de pedidos.
  function pedidos() { return ler(chavePedidos, []); }
  // Informa se existe uma conta local conectada.
  function usuarioEntrou() { return Boolean(usuarioAtual()); }

  // Atualiza o número exibido no indicador do carrinho no cabeçalho.
  function atualizarContador() {
    // Indicador pode não existir em páginas que não exibem o cabeçalho.
    const contador = document.querySelector('[data-contador-carrinho]');
    if (contador) contador.textContent = carrinho().reduce((soma, item) => soma + item.quantidade, 0);
  }
  // Cria o cabeçalho, os links de navegação e o comportamento do menu móvel.
  function montarCabecalho() {
    // Elemento reservado ao cabeçalho no HTML da página atual.
    const cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;
    // Identificador da página, usado para marcar o link ativo no menu.
    const pagina = document.body.dataset.pagina;
    cabecalho.className = 'cabecalho';
    cabecalho.innerHTML = `
      <div class="cabecalho-conteudo">
        <a class="marca" href="index.html" aria-label="KM Tecnologia, início">KM <span>TECNOLOGIA</span></a>
        <nav class="navegacao" aria-label="Navegação principal">
          ${links.map(([nome, href, id]) => `<a href="${href}" class="${pagina === id ? 'ativa' : ''}">${nome}</a>`).join('')}
        </nav>
        <div class="acoes-cabecalho">
          <a class="botao botao-secundario botao-pequeno acao-carrinho" href="carrinho.html" aria-label="Carrinho" title="Carrinho">Carrinho <span class="contador-carrinho" data-contador-carrinho>0</span></a>
          <a class="botao botao-pequeno" href="${usuarioEntrou() ? 'usuario.html' : 'login.html'}">${usuarioEntrou() ? 'Perfil' : 'Entrar'}</a>
        </div>
      </div>`;
  }
  // Preenche o rodapé comum quando a página oferece o elemento correspondente.
  function montarRodape() {
    // Elemento reservado ao rodapé comum no HTML atual.
    const rodape = document.querySelector('[data-rodape]');
    if (rodape) rodape.innerHTML = `<div class="rodape-conteudo"><span>© ${new Date().getFullYear()} KM Tecnologia · Tecnologia com cuidado.</span><a href="admin-login.html">Área administrativa</a></div>`;
  }
  // Adiciona um item ao carrinho ou aumenta a quantidade de um item já existente.
  function adicionarAoCarrinho(item) {
    // Cópia da lista atual que será atualizada e salva.
    const itens = carrinho();
    // Item equivalente já presente no carrinho, se existir.
    const existente = itens.find(atual => atual.id === item.id);
    if (existente) existente.quantidade += 1;
    else itens.push({ ...item, quantidade: 1 });
    if (guardarCarrinho(itens)) {
      atualizarContador();
      alert(`${item.nome} foi adicionado ao carrinho.`);
    }
  }
  // Valida se o número da loja tem DDI/DDD e não é um valor de exemplo.
  function telefoneConfigurado() {
    return /^\d{12,13}$/.test(numeroWhatsApp) && !numeroWhatsApp.includes('000000');
  }
  // Valida o usuário e o carrinho, registra o pedido e oferece envio pelo WhatsApp.
  function finalizarPedido() {
    // Conta necessária para associar a solicitação ao histórico do cliente.
    const usuario = usuarioAtual();
    if (!usuario) {
      alert('Entre ou crie sua conta antes de finalizar o pedido.');
      location.href = 'login.html?retorno=carrinho.html';
      return;
    }
    // Itens que serão registrados no novo pedido.
    const itens = carrinho();
    if (!itens.length) {
      alert('Seu carrinho está vazio.');
      return;
    }
    // Dados persistidos para identificar e acompanhar a solicitação.
    const pedido = {
      id: `KM-${Date.now().toString().slice(-8)}`,
      usuarioEmail: usuario.email,
      usuarioNome: usuario.nome,
      data: new Date().toISOString(),
      tipo: itens.some(item => item.tipo === 'servico') ? 'Serviço' : 'Produto',
      status: 'Aguardando contato',
      itens
    };
    // Histórico atualizado ao qual o novo pedido será acrescentado.
    const historico = pedidos();
    historico.push(pedido);
    if (!gravar(chavePedidos, historico)) return;
    gravar(chaveCarrinho, []);
    atualizarContador();
    // Texto com os itens e dados do pedido, formatado para enviar no WhatsApp.
    const linhas = itens.map(item => `• ${item.nome}${item.opcao ? ` (${item.opcao})` : ''} — qtd. ${item.quantidade}`).join('\n');
    // Mensagem completa preenchida com os detalhes do novo pedido.
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

  // Expõe os helpers que as páginas individuais usam para operar nos dados locais.
  window.KmTecnologia = { ler, gravar, usuarioAtual, usuarioEntrou, carrinho, guardarCarrinho, pedidos, adicionarAoCarrinho, finalizarPedido, atualizarContador, chaveUsuario, chavePedidos, chaveCarrinho };
  // Monta os elementos comuns e sincroniza o contador após carregar o documento.
  document.addEventListener('DOMContentLoaded', () => {
    montarCabecalho();
    montarRodape();
    atualizarContador();
  });
})();
