// Chave do armazenamento local que contém as avaliações publicadas.
const chaveFeedbacks = 'km_tecnologia_feedbacks';

// Formata os serviços incluídos em um pedido para exibição no formulário.
function servicosDoPedido(pedido) {
  return pedido.itens.filter(item => item.tipo === 'servico').map(item => item.nome + (item.opcao ? ` — ${item.opcao}` : '')).join(', ');
}
// Prepara o formulário de avaliação e a lista pública de feedbacks.
document.addEventListener('DOMContentLoaded', () => {
  // Elementos onde são exibidos o formulário e as avaliações existentes.
  const area = document.querySelector('#area-feedback');
  const lista = document.querySelector('#lista-feedbacks');
  // Conta conectada no navegador; sem ela não é possível enviar avaliação.
  const usuario = window.KmTecnologia.usuarioAtual();
  // Avaliações já persistidas neste navegador.
  const feedbacks = window.KmTecnologia.ler(chaveFeedbacks, []);
  // Pedidos concluídos do usuário que ainda podem receber uma avaliação.
  const pedidosConcluidos = usuario
    ? window.KmTecnologia.pedidos().filter(pedido => pedido.usuarioEmail === usuario.email && pedido.status === 'Concluído' && pedido.itens.some(item => item.tipo === 'servico') && !feedbacks.some(feedback => feedback.pedidoId === pedido.id))
    : [];
  // Exibe o formulário apenas para usuários com serviço concluído não avaliado.
  if (!usuario) {
    area.innerHTML = '<div class="vazio">Entre na sua conta para avaliar um serviço concluído.</div>';
  } else if (!pedidosConcluidos.length) {
    area.innerHTML = '<div class="vazio">Não há serviços concluídos sem avaliação. O formulário fica disponível depois que o serviço for marcado como concluído.</div>';
  } else {
    area.innerHTML = `<form class="cartao cartao-conteudo feedback-formulario" id="form-feedback">
      <div class="campo"><label for="pedido-feedback">Serviço concluído</label><select id="pedido-feedback" name="pedidoId" required>${pedidosConcluidos.map(pedido => `<option value="${pedido.id}">${pedido.id} · ${servicosDoPedido(pedido)}</option>`).join('')}</select></div>
      <div class="campo"><label for="nota-feedback">Nota</label><select id="nota-feedback" name="nota" required><option value="5">5 — Excelente</option><option value="4">4 — Muito bom</option><option value="3">3 — Bom</option><option value="2">2 — Regular</option><option value="1">1 — Precisa melhorar</option></select></div>
      <div class="campo"><label for="texto-feedback">Comentário</label><textarea id="texto-feedback" name="comentario" required maxlength="600" placeholder="Conte como foi sua experiência"></textarea></div>
      <button class="botao" type="submit">Publicar feedback</button><p class="mensagem" id="mensagem-feedback" role="status"></p>
    </form>`;
    document.querySelector('#form-feedback').addEventListener('submit', evento => {
      evento.preventDefault();
      // Extrai o pedido e os campos de avaliação enviados pelo usuário.
      const dados = new FormData(evento.currentTarget);
      // Identificador do pedido selecionado no formulário.
      const pedidoId = String(dados.get('pedidoId'));
      // Confirma que o pedido segue disponível e não recebeu outra avaliação.
      const pedido = pedidosConcluidos.find(item => item.id === pedidoId);
      if (!pedido || window.KmTecnologia.ler(chaveFeedbacks, []).some(item => item.pedidoId === pedidoId)) {
        document.querySelector('#mensagem-feedback').textContent = 'Este serviço já recebeu avaliação ou não está mais disponível.';
        return;
      }
      // Coloca a avaliação mais recente no início da lista e persiste os dados.
      const todos = window.KmTecnologia.ler(chaveFeedbacks, []);
      todos.unshift({ pedidoId, nome: usuario.nome, nota: Number(dados.get('nota')), comentario: String(dados.get('comentario')).trim(), data: new Date().toISOString() });
      if (window.KmTecnologia.gravar(chaveFeedbacks, todos)) location.reload();
    });
  }
  // Busca novamente as avaliações para renderizar o conteúdo atualizado.
  const publicados = window.KmTecnologia.ler(chaveFeedbacks, []);
  // Renderiza as avaliações com texto escapado para evitar interpretar HTML enviado.
  lista.innerHTML = publicados.length ? publicados.map(feedback => `
    <article class="cartao cartao-feedback">
      <div class="linha"><strong>${feedback.nome}</strong><span class="estrelas" aria-label="${feedback.nota} de 5 estrelas">${'★'.repeat(feedback.nota)}${'☆'.repeat(5 - feedback.nota)}</span></div>
      <p>${feedback.comentario.replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere])}</p>
      <small class="texto-suave">${new Date(feedback.data).toLocaleDateString('pt-BR')}</small>
    </article>`).join('') : '<div class="vazio">Os feedbacks publicados aparecerão aqui.</div>';
});
