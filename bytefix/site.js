// Define os recursos comuns compartilhados por todas as páginas do site.
(() => {
  // Mantém o carrinho e um perfil público em cache; a sessão real usa cookie HttpOnly.
  const chaveCarrinho = 'km_tecnologia_carrinho';
  const chaveUsuario = 'km_tecnologia_usuario_atual';
  // Migra apenas o carrinho antigo; contas, pedidos e feedbacks passam a ser remotos.
  if (localStorage.getItem(chaveCarrinho) === null && localStorage.getItem('bytefix_carrinho') !== null) {
    try {
      localStorage.setItem(chaveCarrinho, localStorage.getItem('bytefix_carrinho'));
    } catch (erro) {
      console.error('Não foi possível migrar o carrinho local antigo.', erro);
    }
  }
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
  // Retorna somente os dados públicos do usuário guardados para renderizar a interface.
  function usuarioAtual() { return ler(chaveUsuario, null); }
  // Devolve os itens do carrinho, usando uma lista vazia como padrão.
  function carrinho() { return ler(chaveCarrinho, []); }
  // Salva a lista atualizada de itens do carrinho.
  function guardarCarrinho(itens) { return gravar(chaveCarrinho, itens); }
  // Informa se há um perfil em cache; as APIs sempre validam o cookie no servidor.
  function usuarioEntrou() { return Boolean(usuarioAtual()); }

  // Faz chamadas autenticadas à API do mesmo domínio e propaga erros para a página.
  async function requisicaoApi(caminho, opcoes = {}) {
    const resposta = await fetch(caminho, {
      credentials: 'same-origin',
      ...opcoes,
      headers: { ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}), ...opcoes.headers }
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      const erro = new Error(dados.erro || 'Não foi possível concluir a operação.');
      erro.status = resposta.status;
      throw erro;
    }
    return dados;
  }
  // Atualiza o perfil público em cache usando a sessão validada no servidor.
  async function sincronizarUsuario() {
    try {
      const resultado = await requisicaoApi('/api/customer/session');
      gravar(chaveUsuario, resultado.usuario);
      montarCabecalho();
      return resultado.usuario;
    } catch (erro) {
      if (erro.status === 401) {
        localStorage.removeItem(chaveUsuario);
        montarCabecalho();
        return null;
      }
      throw erro;
    }
  }

  // Atualiza o número exibido no indicador do carrinho no cabeçalho.
  function atualizarContador() {
    // Indicador pode não existir em páginas que não exibem o cabeçalho.
    const contador = document.querySelector('[data-contador-carrinho]');
    if (contador) contador.textContent = carrinho().reduce((soma, item) => soma + item.quantidade, 0);
  }
  // Cria o cabeçalho e os links de navegação compartilhados.
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
  // Envia o carrinho ao servidor, grava o pedido no banco e abre o WhatsApp.
  async function finalizarPedido() {
    // Impede uma requisição desnecessária quando não há itens para solicitar.
    const itens = carrinho();
    if (!itens.length) {
      alert('Seu carrinho está vazio.');
      return;
    }
    // Abre a aba durante o clique do usuário para evitar bloqueio após a chamada assíncrona.
    const janelaWhatsapp = usuarioAtual() && telefoneConfigurado() ? window.open('about:blank', '_blank') : null;
    if (janelaWhatsapp) janelaWhatsapp.opener = null;

    // Perfil público usado para compor a mensagem; a API valida a sessão separadamente.
    let usuario;
    try {
      usuario = await sincronizarUsuario();
    } catch (erro) {
      if (janelaWhatsapp) janelaWhatsapp.close();
      alert(`Não foi possível verificar sua conta: ${erro.message}`);
      return;
    }
    if (!usuario) {
      if (janelaWhatsapp) janelaWhatsapp.close();
      alert('Entre ou crie sua conta antes de finalizar o pedido.');
      location.href = 'login.html?retorno=carrinho.html';
      return;
    }
    // Persiste o pedido no Supabase antes de limpar o carrinho local.
    let pedido;
    try {
      ({ pedido } = await requisicaoApi('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ itens })
      }));
    } catch (erro) {
      if (janelaWhatsapp) janelaWhatsapp.close();
      alert(`Não foi possível salvar o pedido: ${erro.message}`);
      return;
    }
    gravar(chaveCarrinho, []);
    atualizarContador();
    // Texto com os itens e dados do pedido, formatado para enviar no WhatsApp.
    const linhas = itens.map(item => `• ${item.nome}${item.opcao ? ` (${item.opcao})` : ''} — qtd. ${item.quantidade}`).join('\n');
    // Mensagem completa preenchida com os detalhes do novo pedido.
    const mensagem = `Olá! Quero solicitar este pedido na KM Tecnologia:\n${linhas}\n\nPedido ${pedido.id}\nCliente: ${usuario.nome}`;
    if (!telefoneConfigurado()) {
      alert(`Pedido ${pedido.id} salvo no banco de dados, mas o WhatsApp da loja ainda não foi configurado. Atualize o número em site.js para receber a solicitação.`);
      location.href = 'usuario.html';
      return;
    }
    const urlWhatsapp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    if (janelaWhatsapp) janelaWhatsapp.location.href = urlWhatsapp;
    else location.href = urlWhatsapp;
    alert(`Pedido ${pedido.id} registrado no banco. Envie a mensagem que foi aberta no WhatsApp para concluir a solicitação.`);
    location.href = 'usuario.html';
  }

  // Expõe os helpers que as páginas individuais usam para operar nos dados locais.
  window.KmTecnologia = { ler, gravar, usuarioAtual, usuarioEntrou, sincronizarUsuario, requisicaoApi, carrinho, guardarCarrinho, adicionarAoCarrinho, finalizarPedido, atualizarContador, chaveUsuario, chaveCarrinho };
  // Monta os elementos comuns e atualiza o perfil em cache com a sessão do servidor.
  document.addEventListener('DOMContentLoaded', () => {
    montarCabecalho();
    montarRodape();
    atualizarContador();
    sincronizarUsuario().catch(erro => console.error('Não foi possível sincronizar a sessão do cliente.', erro));
  });
})();
