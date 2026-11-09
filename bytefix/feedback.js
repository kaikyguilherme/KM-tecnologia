// Codifica textos inseridos no HTML para impedir interpretação de marcação enviada.
function textoFeedbackSeguro(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
}

// Formata os serviços incluídos em um pedido para exibição no seletor.
function servicosDoPedido(pedido) {
  return pedido.items.filter(item => item.tipo === 'servico').map(item => item.nome + (item.opcao ? ` — ${item.opcao}` : '')).join(', ');
}

// Carrega avaliações públicas e habilita feedback para serviços concluídos da conta.
document.addEventListener('DOMContentLoaded', async () => {
  const area = document.querySelector('#area-feedback');
  const lista = document.querySelector('#lista-feedbacks');
  try {
    const resultadoFeedbacks = await window.KmTecnologia.requisicaoApi('/api/feedback');
    const usuario = await window.KmTecnologia.sincronizarUsuario();
    const pedidos = usuario
      ? (await window.KmTecnologia.requisicaoApi('/api/orders')).pedidos
      : [];
    const pedidosAvaliaveis = pedidos.filter(pedido =>
      pedido.status === 'Concluído'
      && pedido.items.some(item => item.tipo === 'servico')
      && !resultadoFeedbacks.feedbacks.some(feedback => feedback.order_id === pedido.id)
    );

    if (!usuario) {
      area.innerHTML = '<div class="vazio">Entre na sua conta para avaliar um serviço concluído.</div>';
    } else if (!pedidosAvaliaveis.length) {
      area.innerHTML = '<div class="vazio">Não há serviços concluídos sem avaliação. O formulário fica disponível depois que o serviço for marcado como concluído.</div>';
    } else {
      area.innerHTML = `<form class="cartao cartao-conteudo feedback-formulario" id="form-feedback">
        <div class="campo"><label for="pedido-feedback">Serviço concluído</label><select id="pedido-feedback" name="pedidoId" required>${pedidosAvaliaveis.map(pedido => `<option value="${textoFeedbackSeguro(pedido.id)}">${textoFeedbackSeguro(pedido.id)} · ${textoFeedbackSeguro(servicosDoPedido(pedido))}</option>`).join('')}</select></div>
        <div class="campo"><label for="nota-feedback">Nota</label><select id="nota-feedback" name="nota" required><option value="5">5 — Excelente</option><option value="4">4 — Muito bom</option><option value="3">3 — Bom</option><option value="2">2 — Regular</option><option value="1">1 — Precisa melhorar</option></select></div>
        <div class="campo"><label for="texto-feedback">Comentário</label><textarea id="texto-feedback" name="comentario" required maxlength="600" placeholder="Conte como foi sua experiência"></textarea></div>
        <button class="botao" type="submit">Publicar feedback</button><p class="mensagem" id="mensagem-feedback" role="status"></p>
      </form>`;
      document.querySelector('#form-feedback').addEventListener('submit', async evento => {
        evento.preventDefault();
        const formulario = evento.currentTarget;
        const botao = formulario.querySelector('button[type="submit"]');
        const dados = new FormData(formulario);
        botao.disabled = true;
        try {
          await window.KmTecnologia.requisicaoApi('/api/feedback', {
            method: 'POST',
            body: JSON.stringify({
              pedidoId: dados.get('pedidoId'),
              nota: Number(dados.get('nota')),
              comentario: String(dados.get('comentario')).trim()
            })
          });
          location.reload();
        } catch (erro) {
          document.querySelector('#mensagem-feedback').textContent = erro.message;
          document.querySelector('#mensagem-feedback').classList.add('erro');
          botao.disabled = false;
        }
      });
    }

    lista.innerHTML = resultadoFeedbacks.feedbacks.length ? resultadoFeedbacks.feedbacks.map(feedback => `
      <article class="cartao cartao-feedback">
        <div class="linha"><strong>${textoFeedbackSeguro(feedback.user_name)}</strong><span class="estrelas" aria-label="${feedback.rating} de 5 estrelas">${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}</span></div>
        <p>${textoFeedbackSeguro(feedback.comment)}</p>
        <small class="texto-suave">${new Date(feedback.created_at).toLocaleDateString('pt-BR')}</small>
      </article>`).join('') : '<div class="vazio">Os feedbacks publicados aparecerão aqui.</div>';
  } catch (erro) {
    area.innerHTML = `<div class="vazio erro">${textoFeedbackSeguro(erro.message)}</div>`;
  }
});
