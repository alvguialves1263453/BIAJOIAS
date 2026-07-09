import { data } from '../store.js';
import { formatCurrency, formatDate, daysUntil } from '../helpers.js';
import { openModal, closeModal } from '../modal.js';

window.openModal = openModal;
window.closeModal = closeModal;

export function renderDashboard() {
  var totalEstoque = 0;
  for (var i = 0; i < data.produtos.length; i++) {
    if (data.produtos[i].status !== 'Devolvido') totalEstoque++;
  }
  document.getElementById('metricTotalEstoque').textContent = totalEstoque;

  var maletasAtivas = 0;
  for (var j = 0; j < data.maletas.length; j++) {
    if (data.maletas[j].status === 'Ativa') maletasAtivas++;
  }
  document.getElementById('metricMaletasAtivas').textContent = maletasAtivas;

  var now = new Date();
  var mesAtual = now.getMonth();
  var anoAtual = now.getFullYear();

  var vendidosMes = 0;
  for (var l = 0; l < data.vendas.length; l++) {
    var v = data.vendas[l];
    if (v.data) {
      var vd = new Date(v.data + 'T00:00:00');
      if (vd.getMonth() === mesAtual && vd.getFullYear() === anoAtual) vendidosMes++;
    }
  }
  document.getElementById('metricProdVendidos').textContent = vendidosMes;

  var reservados = 0;
  for (var m = 0; m < data.produtos.length; m++) {
    if (data.produtos[m].status === 'Reservado') reservados++;
  }
  document.getElementById('metricProdReservados').textContent = reservados;

  var reposPendentes = 0;
  for (var rp = 0; rp < data.reposicoes.length; rp++) {
    if (data.reposicoes[rp].status === 'Pendente' || data.reposicoes[rp].status === 'Pedido') reposPendentes++;
  }
  var repoEl = document.getElementById('metricReposicoesPendentes');
  if (repoEl) repoEl.textContent = reposPendentes;

  var fatMes = 0;
  for (var n = 0; n < data.vendas.length; n++) {
    var v2 = data.vendas[n];
    if (v2.recebido && v2.data) {
      var vd2 = new Date(v2.data + 'T00:00:00');
      if (vd2.getMonth() === mesAtual && vd2.getFullYear() === anoAtual) {
        fatMes += (v2.valor - (v2.desconto || 0));
      }
    }
  }
  document.getElementById('metricFaturamentoMes').textContent = formatCurrency(fatMes);

  var alertCard = document.getElementById('alertDevolucoes');
  var alertText = document.getElementById('alertDevolucoesText');
  var proximas = [];
  for (var p = 0; p < data.maletas.length; p++) {
    var mal = data.maletas[p];
    if (mal.status === 'Ativa' && mal.dataLimite) {
      var days = daysUntil(mal.dataLimite);
      if (days !== null && days >= 0 && days <= 15) {
        proximas.push(mal.nome + ' (' + days + ' dias)');
      }
    }
  }
  if (proximas.length > 0) {
    alertText.textContent = 'Maletas pr\u00f3ximas do prazo: ' + proximas.join('; ') + '.';
    if (alertCard) alertCard.style.display = '';
  } else {
    if (alertCard) alertCard.style.display = 'none';
  }

  var chartEl = document.getElementById('chartBars');
  if (chartEl) {
    chartEl.innerHTML = '';
    var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    var vendasPorMes = [];
    for (var mi = 0; mi < 12; mi++) vendasPorMes[mi] = 0;
    for (var vi = 0; vi < data.vendas.length; vi++) {
      var v3 = data.vendas[vi];
      if (v3.data) {
        var vd3 = new Date(v3.data + 'T00:00:00');
        if (vd3.getFullYear() === anoAtual) {
          vendasPorMes[vd3.getMonth()] += v3.valor - (v3.desconto || 0);
        }
      }
    }
    var maxVal = 0;
    for (var mi2 = 0; mi2 < 12; mi2++) {
      if (vendasPorMes[mi2] > maxVal) maxVal = vendasPorMes[mi2];
    }
    for (var mi3 = 0; mi3 < 6; mi3++) {
      var idx = mi3;
      var val = vendasPorMes[idx];
      var h = maxVal > 0 ? Math.max(20, (val / maxVal) * 140) : 20;
      var bar = document.createElement('div');
      bar.className = 'bar' + (mi3 % 2 === 1 ? ' rose' : '');
      bar.style.height = Math.round(h) + 'px';
      bar.innerHTML = '<span class="bar-label">' + meses[idx] + '</span>';
      chartEl.appendChild(bar);
    }
  }

  // Últimas Vendas
  var ultimasContainer = document.getElementById('ultimasVendas');
  if (ultimasContainer) {
    ultimasContainer.innerHTML = '';
    var sorted = data.vendas.slice().sort(function(a,b) { return (b.data || '').localeCompare(a.data || '') });
    var recentes = sorted.slice(0, 5);
    if (recentes.length === 0) {
      ultimasContainer.innerHTML = '<p style="color:var(--text-light);font-size:13px;text-align:center;padding:16px">Nenhuma venda registrada.</p>';
    } else {
      for (var ri = 0; ri < recentes.length; ri++) {
        var v = recentes[ri];
        var prodNome = '';
        for (var pi = 0; pi < data.produtos.length; pi++) {
          if (data.produtos[pi].id === v.produtoId) { prodNome = data.produtos[pi].nome; break; }
        }
        var cliNome = v.clienteNome || '';
        if (!cliNome) {
          for (var ci = 0; ci < data.clientes.length; ci++) {
            if (data.clientes[ci].id === v.clienteId) { cliNome = data.clientes[ci].nome; break; }
          }
        }
        var card = document.createElement('div');
        card.className = 'venda-card';
        card.style.cursor = 'pointer';
        card.onclick = function() { window.editarVenda(this.dataset.vendaId) };
        card.dataset.vendaId = v.id;
        card.innerHTML =
          '<div class="venda-icon ' + (v.recebido ? 'sold' : 'pending') + '"><i class="fas fa-' + (v.recebido ? 'check-circle' : 'clock') + '"></i></div>' +
          '<div class="venda-info">' +
          '<strong>' + prodNome + '</strong>' +
          '<span>' + cliNome + '</span>' +
          '<div class="venda-meta"><span>' + (v.formaPagamento || '-') + '</span><span>' + formatDate(v.data) + '</span></div>' +
          '</div>' +
          '<div class="venda-valor">' + formatCurrency(v.valor - (v.desconto || 0)) + '</div>';
        ultimasContainer.appendChild(card);
      }
    }
  }
}
window.renderDashboard = renderDashboard;
