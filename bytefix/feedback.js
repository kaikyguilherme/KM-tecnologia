const chaveFeedbacks = 'km_tecnologia_feedbacks';

function servicosDoPedido(pedido) {
  return pedido.itens.filter(item => item.tipo === 'servico').map(item => item.nome + (item.opcao ? ` — ${item.opcao}` : '')).join(', ');
}
document.addEventListener('DOMContentLoaded', () => {
  const area = document.querySelector('#area-feedback');
  const lista = document.querySelector('#lista-feedbacks');
  const usuario = window.KmTecnologia.usuarioAtual();
  const feedbacks = window.KmTecnologia.ler(chaveFeedbacks, []);
  const pedidosConcluidos = usuario
    ? window.KmTecnologia.pedidos().filter(pedido => pedido.usuarioEmail === usuario.email && pedido.status === 'Concluído' && pedido.itens.some(item => item.tipo === 'servico') && !feedbacks.some(feedback => feedback.pedidoId === pedido.id))
    : [];
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
      const dados = new FormData(evento.currentTarget);
      const pedidoId = String(dados.get('pedidoId'));
      const pedido = pedidosConcluidos.find(item => item.id === pedidoId);
      if (!pedido || window.KmTecnologia.ler(chaveFeedbacks, []).some(item => item.pedidoId === pedidoId)) {
        document.querySelector('#mensagem-feedback').textContent = 'Este serviço já recebeu avaliação ou não está mais disponível.';
        return;
      }
      const todos = window.KmTecnologia.ler(chaveFeedbacks, []);
      todos.unshift({ pedidoId, nome: usuario.nome, nota: Number(dados.get('nota')), comentario: String(dados.get('comentario')).trim(), data: new Date().toISOString() });
      if (window.KmTecnologia.gravar(chaveFeedbacks, todos)) location.reload();
    });
  }
  const publicados = window.KmTecnologia.ler(chaveFeedbacks, []);
  lista.innerHTML = publicados.length ? publicados.map(feedback => `
    <article class="cartao cartao-feedback">
      <div class="linha"><strong>${feedback.nome}</strong><span class="estrelas" aria-label="${feedback.nota} de 5 estrelas">${'★'.repeat(feedback.nota)}${'☆'.repeat(5 - feedback.nota)}</span></div>
      <p>${feedback.comentario.replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere])}</p>
      <small class="texto-suave">${new Date(feedback.data).toLocaleDateString('pt-BR')}</small>
    </article>`).join('') : '<div class="vazio">Os feedbacks publicados aparecerão aqui.</div>';
});
