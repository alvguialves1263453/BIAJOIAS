import { data, removeItem } from '../store.js'
import { formatCurrency, formatDate } from '../helpers.js'
import { showToast, showConfirm } from '../modal.js'

export function renderFinanceiro() {
  var dataInicio = document.getElementById('finDataInicio').value;
  var dataFim = document.getElementById('finDataFim').value;

  var filtered = [];
  for (var i = 0; i < data.vendas.length; i++) {
    var v = data.vendas[i];
    if (dataInicio && v.data < dataInicio) continue;
    if (dataFim && v.data > dataFim) continue;
    filtered.push(v);
  }

  var receitaTotal = 0;
  var custoTotal = 0;
  for (var j = 0; j < filtered.length; j++) {
    var v2 = filtered[j];
    receitaTotal += v2.valor - (v2.desconto || 0);
    for (var k = 0; k < data.produtos.length; k++) {
      if (data.produtos[k].id === v2.produtoId) {
        custoTotal += data.produtos[k].precoCusto || 0;
        break;
      }
    }
  }

  var lucroLiquido = receitaTotal - custoTotal;
  var comissoes = receitaTotal * 0.1;
  var ticketMedio = filtered.length > 0 ? receitaTotal / filtered.length : 0;

  document.getElementById('finReceitaTotal').textContent = formatCurrency(receitaTotal);
  document.getElementById('finLucroLiquido').textContent = formatCurrency(lucroLiquido);
  document.getElementById('finComissoes').textContent = formatCurrency(comissoes);
  document.getElementById('finTicketMedio').textContent = formatCurrency(ticketMedio);

  var container = document.getElementById('listaTransacoes');
  var empty = document.getElementById('emptyTransacoes');
  if (!container) return;
  container.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    for (var l = 0; l < filtered.length; l++) {
      var v3 = filtered[l];
      var prodNome = '';
      var cliNome = '';
      for (var m = 0; m < data.produtos.length; m++) {
        if (data.produtos[m].id === v3.produtoId) { prodNome = data.produtos[m].nome; break; }
      }
      for (var n = 0; n < data.clientes.length; n++) {
        if (data.clientes[n].id === v3.clienteId) { cliNome = data.clientes[n].nome; break; }
      }

      var card = document.createElement('div');
      card.className = 'venda-card';
      var total = v3.valor - (v3.desconto || 0);
      card.innerHTML =
        '<div class="venda-icon"><i class="fas fa-receipt"></i></div>' +
        '<div class="venda-info">' +
        '<strong>' + prodNome + '</strong>' +
        '<span>' + cliNome + '</span>' +
        '<div class="venda-meta">' +
        '<span>' + formatDate(v3.data) + '</span>' +
        '<span>' + (v3.formaPagamento || '-') + '</span>' +
        '</div></div>' +
        '<div class="venda-valor">' +
        formatCurrency(total) +
        (v3.desconto > 0 ? '<small style="color:var(--danger)">-' + formatCurrency(v3.desconto) + '</small>' : '') +
        '</div>';
      container.appendChild(card);
    }
  }

  document.getElementById('finTotalVendas').textContent = filtered.length;

  var chartEl = document.getElementById('finChartBars');
  if (chartEl) {
    chartEl.innerHTML = '';
    var meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    var vendasPorMes = [];
    for (var mi = 0; mi < 12; mi++) vendasPorMes[mi] = 0;
    for (var vi = 0; vi < data.vendas.length; vi++) {
      var v4 = data.vendas[vi];
      if (dataInicio && v4.data < dataInicio) continue;
      if (dataFim && v4.data > dataFim) continue;
      if (v4.data) {
        var vd = new Date(v4.data + 'T00:00:00');
        vendasPorMes[vd.getMonth()] += v4.valor - (v4.desconto || 0);
      }
    }
    var maxVal = 0;
    for (var mi2 = 0; mi2 < 12; mi2++) {
      if (vendasPorMes[mi2] > maxVal) maxVal = vendasPorMes[mi2];
    }
    for (var mi3 = 0; mi3 < 6; mi3++) {
      var idx = mi3 * 2;
      var val = vendasPorMes[idx];
      var h = maxVal > 0 ? Math.max(20, (val / maxVal) * 140) : 20;
      var bar = document.createElement('div');
      bar.className = 'bar' + (mi3 % 2 === 1 ? ' rose' : '');
      bar.style.height = Math.round(h) + 'px';
      bar.innerHTML = '<span class="bar-label">' + meses[idx] + '</span>';
      chartEl.appendChild(bar);
    }
  }
}

export async function resetarFinancas() {
  var total = data.vendas.length;
  if (total === 0) {
    showToast('N\u00e3o h\u00e1 vendas para resetar.', 'info');
    return;
  }
  var c = await showConfirm('Tem certeza que deseja resetar todas as ' + total + ' venda' + (total > 1 ? 's' : '') + '? Essa a\u00e7\u00e3o n\u00e3o pode ser desfeita.');
  if (!c) return;
  try {
    for (var i = 0; i < data.vendas.length; i++) {
      await removeItem('vendas', data.vendas[i].id);
    }
    showToast('Todas as vendas foram removidas.', 'success');
    renderFinanceiro();
  } catch (e) {
    showToast('Erro ao resetar finan\u00e7as.', 'error');
    console.error(e);
  }
}
window.resetarFinancas = resetarFinancas;

window.renderFinanceiro = renderFinanceiro;
